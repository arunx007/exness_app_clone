/**
 * In-WebView MT5 market socket (same pattern as PortalTerminal market-socket.ts).
 * History and live candles load inside chart.html — no React Native bridge for bars.
 */
(function (global) {
  function normalizeSymbol(symbol) {
    if (!symbol) return '';
    return symbol
      .split('.')[0]
      .trim()
      .replace(/[macfhr]+$/i, '')
      .toUpperCase();
  }

  function resolutionToTimeframe(resolution) {
    if (resolution === '1') return 'M1';
    if (resolution === '3') return 'M3';
    if (resolution === '5') return 'M5';
    if (resolution === '15') return 'M15';
    if (resolution === '30') return 'M30';
    if (resolution === '60') return 'H1';
    if (resolution === '240') return 'H4';
    if (resolution === 'D' || resolution === '1D') return 'D1';
    if (resolution === 'W' || resolution === '1W') return 'W1';
    if (resolution === 'M' || resolution === '1M') return 'Mn1';
    return resolution;
  }

  function normalizeTime(time) {
    var num = Number(time);
    if (!Number.isFinite(num) || num <= 0) return 0;
    return num < 1e12 ? num * 1000 : num;
  }

  function isValidBarTime(timeMs) {
    if (!Number.isFinite(timeMs) || timeMs <= 0) return false;
    var nowMs = Date.now();
    return timeMs >= nowMs - 400 * 86400000 && timeMs <= nowMs + 2 * 86400000;
  }

  function ChartMarketSocket(wsUrl) {
    this.url = wsUrl;
    this.ws = null;
    this.queue = [];
    this.reconnectTimer = null;
    this.watchSymbols = new Set();
    this.quoteListeners = new Set();
    this.historyCallbacks = new Map();
    this.candleSubs = new Map();
    this.quotes = new Map();
    this.serverTimeOffset = 0;
  }

  ChartMarketSocket.prototype.connect = function () {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    var self = this;
    this.ws = new WebSocket(this.url);
    this.ws.onopen = function () {
      self.resubscribe();
      while (self.queue.length) self.sendRaw(self.queue.shift());
    };
    this.ws.onmessage = function (event) {
      try {
        self.handleMessage(JSON.parse(event.data));
      } catch (_) {}
    };
    this.ws.onclose = function () {
      self.ws = null;
      if (self.reconnectTimer) clearTimeout(self.reconnectTimer);
      self.reconnectTimer = setTimeout(function () {
        self.connect();
      }, 2500);
    };
    this.ws.onerror = function () {};
  };

  ChartMarketSocket.prototype.send = function (payload) {
    this.sendRaw(JSON.stringify(payload));
  };

  ChartMarketSocket.prototype.sendRaw = function (payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
      return;
    }
    this.queue.push(payload);
  };

  ChartMarketSocket.prototype.resubscribe = function () {
    var symbols = new Set(this.watchSymbols);
    this.candleSubs.forEach(function (sub) {
      symbols.add(sub.symbol);
    });
    if (symbols.size === 0) return;
    this.sendSubscription(Array.from(symbols), ['watch', 'candle_live']);
  };

  ChartMarketSocket.prototype.sendSubscription = function (symbols, streams) {
    var unique = Array.from(new Set(symbols.filter(Boolean).map(normalizeSymbol)));
    if (!unique.length) return;
    this.send({ type: 'sub_symbols', symbols: unique, streams: streams });
  };

  ChartMarketSocket.prototype.requestHistory = function (symbol, resolution, count, onSuccess, onError) {
    this.connect();
    var norm = normalizeSymbol(symbol);
    var tf = resolutionToTimeframe(resolution);
    var key = norm + '-' + tf;
    var self = this;
    this.historyCallbacks.set(key, {
      onSuccess: onSuccess,
      onError: onError,
    });
    this.send({ type: 'candle_history', symbol: norm, tf: tf, count: count });
    setTimeout(function () {
      if (!self.historyCallbacks.has(key)) return;
      self.historyCallbacks.delete(key);
      onError('History request timed out');
    }, 15000);
  };

  ChartMarketSocket.prototype.subscribeCandle = function (symbol, resolution, listener) {
    this.connect();
    var norm = normalizeSymbol(symbol);
    var tf = resolutionToTimeframe(resolution);
    var id = norm + '-' + tf + '-' + Math.random().toString(36).slice(2);
    this.candleSubs.set(id, { symbol: norm, tf: tf, listener: listener });
    this.watchSymbols.add(norm);
    this.sendSubscription([norm], ['candle_live', 'watch']);
    var self = this;
    return function () {
      self.candleSubs.delete(id);
    };
  };

  ChartMarketSocket.prototype.subscribeQuotes = function (symbols, listener) {
    this.connect();
    var self = this;
    symbols.map(normalizeSymbol).forEach(function (s) {
      self.watchSymbols.add(s);
    });
    this.quoteListeners.add(listener);
    this.sendSubscription(
      symbols.map(normalizeSymbol),
      ['watch'],
    );
    symbols.forEach(function (symbol) {
      var quote = self.quotes.get(normalizeSymbol(symbol));
      if (quote) listener(quote);
    });
    return function () {
      self.quoteListeners.delete(listener);
    };
  };

  ChartMarketSocket.prototype.getQuote = function (symbol) {
    return this.quotes.get(normalizeSymbol(symbol));
  };

  ChartMarketSocket.prototype.handleMessage = function (data) {
    if (data.type === 'watch') this.handleQuote(data);
    if (data.type === 'candle_snapshot' || data.type === 'candle_history') this.handleHistory(data);
    if (data.type === 'candle_update') this.handleCandle(data);
  };

  ChartMarketSocket.prototype.handleQuote = function (data) {
    var norm = normalizeSymbol(data.symbol);
    var existing = this.quotes.get(norm);
    var quote = {
      symbol: norm,
      bid: Number(data.bid) || (existing && existing.bid) || 0,
      ask: Number(data.ask) || (existing && existing.ask) || 0,
      lastValidBid:
        Number(data.bid) > 0 ? Number(data.bid) : existing && existing.lastValidBid,
      lastValidAsk:
        Number(data.ask) > 0 ? Number(data.ask) : existing && existing.lastValidAsk,
    };
    this.quotes.set(norm, quote);
    this.quoteListeners.forEach(function (listener) {
      listener(quote);
    });
  };

  ChartMarketSocket.prototype.handleHistory = function (data) {
    var tf = resolutionToTimeframe(data.tf);
    var key = normalizeSymbol(data.symbol) + '-' + tf;
    var callback = this.historyCallbacks.get(key);
    if (!callback) return;

    var nowMs = Date.now();
    var candles = Array.isArray(data.candles) ? data.candles : [];
    if (this.serverTimeOffset === 0) {
      for (var i = 0; i < candles.length; i++) {
        var rawT = normalizeTime(candles[i].t);
        if (rawT > nowMs + 60000) {
          this.serverTimeOffset = Math.round((rawT - nowMs) / 1800000) * 1800000;
          break;
        }
      }
    }

    var bars = candles
      .map(function (c) {
        return {
          time: normalizeTime(c.t) - this.serverTimeOffset,
          open: Number(c.o),
          high: Number(c.h),
          low: Number(c.l),
          close: Number(c.c),
          volume: Number(c.v) || 0,
        };
      }, this)
      .sort(function (a, b) {
        return a.time - b.time;
      });

    this.historyCallbacks.delete(key);
    callback.onSuccess(bars, { noData: bars.length === 0 });
  };

  ChartMarketSocket.prototype.handleCandle = function (data) {
    var norm = normalizeSymbol(data.symbol);
    var tf = resolutionToTimeframe(data.tf);
    var rawTime = normalizeTime(data.t);
    var nowMs = Date.now();
    if (rawTime > nowMs + 60000 && this.serverTimeOffset === 0) {
      this.serverTimeOffset = Math.round((rawTime - nowMs) / 1800000) * 1800000;
    }
    var bar = {
      time: rawTime - this.serverTimeOffset,
      open: Number(data.o),
      high: Number(data.h),
      low: Number(data.l),
      close: Number(data.c),
      volume: Number(data.v) || 0,
    };
    if (!isValidBarTime(bar.time)) return;
    this.candleSubs.forEach(function (sub) {
      if (sub.symbol === norm && sub.tf === tf) sub.listener(bar);
    });
  };

  global.ChartMarketSocket = ChartMarketSocket;
  global.ChartSocketUtils = {
    normalizeSymbol: normalizeSymbol,
    resolutionToTimeframe: resolutionToTimeframe,
    isValidBarTime: isValidBarTime,
  };
})(window);
