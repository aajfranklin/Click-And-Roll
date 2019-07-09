//
// JavaScript implementation of the AhoCorasick string searching algorithm.
//
// Original source code by BrunoRB, found here:
// https://github.com/BrunoRB/ahocorasick
//
// The original code has been lightly edited with some ES6 syntax
//
// Licensed under the MIT license:
//
// MIT License
//
// Copyright (c) 2017 Bruno Roberto Búrigo
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

(function() {
  'use strict';

  const AhoCorasick = function(keywords) {
    this._buildTables(keywords);
  };

  AhoCorasick.prototype._buildTables = function(keywords) {
    const gotoFn = {
      0: {}
    };
    const output = {};

    let state = 0;
    keywords.forEach(function(word) {
      let curr = 0;
      for (let i=0; i<word.length; i++) {
        const l = word[i];
        if (gotoFn[curr] && l in gotoFn[curr]) {
          curr = gotoFn[curr][l];
        }
        else {
          state++;
          gotoFn[curr][l] = state;
          gotoFn[state] = {};
          curr = state;
          output[state] = [];
        }
      }

      output[curr].push(word);
    });

    const failure = {};
    const xs = [];

    // f(s) = 0 for all states of depth 1 (the ones from which the 0 state can transition to)
    for (const l in gotoFn[0]) {
      const state = gotoFn[0][l];
      failure[state] = 0;
      xs.push(state);
    }

    while (xs.length) {
      const r = xs.shift();
      // for each symbol a such that g(r, a) = s
      for (const l in gotoFn[r]) {
        const s = gotoFn[r][l];
        xs.push(s);

        // set state = f(r)
        let state = failure[r];
        while(state > 0 && !(l in gotoFn[state])) {
          state = failure[state];
        }

        if (l in gotoFn[state]) {
          const fs = gotoFn[state][l];
          failure[s] = fs;
          output[s] = output[s].concat(output[fs]);
        }
        else {
          failure[s] = 0;
        }
      }
    }

    this.gotoFn = gotoFn;
    this.output = output;
    this.failure = failure;
  };

  AhoCorasick.prototype.search = function(string) {
    let state = 0;
    const results = [];
    for (let i=0; i<string.length; i++) {
      const l = string[i];
      while (state > 0 && !(l in this.gotoFn[state])) {
        state = this.failure[state];
      }
      if (!(l in this.gotoFn[state])) {
        continue;
      }

      state = this.gotoFn[state][l];

      if (this.output[state].length) {
        const foundStrs = this.output[state];
        results.push([i, foundStrs]);
      }
    }

    return results;
  };

    window.AhoCorasick = AhoCorasick;
})();
