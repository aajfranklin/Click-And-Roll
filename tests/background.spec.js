describe('Background Scripts', () => {

  describe('MessageHandler', () => {

    const messageHandler = new MessageHandler();

    describe('addListeners', () => {
      let handleLoadStub;
      let onMessageStub;
      let onActivatedStub;

      before(() => {

        chrome.runtime.onMessage = {addListener: () => {}};
        chrome.tabs = {onActivated: {addListener: () => {}}};

        handleLoadStub = sinon.stub(messageHandler, 'handleLoad');
        onMessageStub = sinon.stub(chrome.runtime.onMessage, 'addListener');
        onActivatedStub = sinon.stub(chrome.tabs.onActivated, 'addListener');

        handleLoadStub.returns(null);
        onMessageStub.returns(null);
        onActivatedStub.returns(null);
      });

      afterEach(() => {
        handleLoadStub.resetHistory();
        onMessageStub.resetHistory();
        onActivatedStub.resetHistory();
      });

      after(() => {
        handleLoadStub.restore();
        onMessageStub.restore();
        onActivatedStub.restore();
      });

      it('should call chrome runtime on message add listener with correct listener', () => {
        messageHandler.addListeners();
        expect(onMessageStub.calledOnce).to.equal(true);
        expect(onMessageStub.firstCall.args[0]).to.equal(messageHandler.handleMessage);
        expect(onActivatedStub.calledOnce).to.equal(true);
        expect(handleLoadStub.calledOnce).to.equal(false);
        onActivatedStub.firstCall.args[0]();
        expect(handleLoadStub.calledOnce).to.equal(true);
      });

    });

    describe('handleMessage', () => {

      let handleFetchPlayersStub;
      let handleFetchStatsStub;
      let handleLoadStub;

      before(() => {
        handleFetchPlayersStub = sinon.stub(messageHandler, 'handleFetchPlayers');
        handleFetchStatsStub = sinon.stub(messageHandler, 'handleFetchStats');
        handleLoadStub = sinon.stub(messageHandler, 'handleLoad');

        handleFetchPlayersStub.resolves(null);
        handleFetchStatsStub.resolves(null);
      });

      afterEach(() => {
        handleFetchPlayersStub.resetHistory();
        handleFetchStatsStub.resetHistory();
        handleLoadStub.resetHistory();
      });

      after(() => {
        handleFetchPlayersStub.restore();
        handleFetchStatsStub.restore();
        handleLoadStub.restore();
      });

      describe('if request message is load', () => {

        it('should delegate to handleLoad', () => {
          messageHandler.handleMessage({message:'load'}, null, null);
          expect(handleLoadStub.calledOnce).to.equal(true);
        });

      });

      describe('if request message is fetchPlayers', () => {

        it('should delegate to handleFetchPlayers', () => {
          messageHandler.handleMessage({message:'fetchPlayers'}, null, null);
          expect(handleFetchPlayersStub.calledOnce).to.equal(true);
        });

        it('should return true, to indicate that response should be sent asynchronously', () => {
          expect(messageHandler.handleMessage({message:'fetchPlayers'}, null, null)).to.equal(true);
        });

      });

      describe('if request message is fetchStats', () => {

        it('should delegate to handleFetchStats', () => {
          messageHandler.handleMessage({message:'fetchStats'}, null, null);
          expect(handleFetchStatsStub.calledOnce).to.equal(true);
        });

        it('should return true, to indicate that response should be sent asynchronously', () => {
          expect(messageHandler.handleMessage({message:'fetchStats'}, null, null)).to.equal(true);
        });

      });

      describe('if request message is invalid', () => {

        it('should return false', () => {
          expect(messageHandler.handleMessage({message:''}, null, null)).to.equal(false);
        });

        it('should not delegate to another handler', () => {
          messageHandler.handleMessage({message:''}, null, null);
          expect(handleFetchPlayersStub.notCalled).to.equal(true);
          expect(handleFetchStatsStub.notCalled).to.equal(true);
        });

      });

    });

    describe('handleLoad', () => {

      let getActiveTabStub;
      let isExtensionOnStub;
      let messageActiveTabStub;
      let setIconStub;

      let testTab;

      before(() => {
        chrome.browserAction = {
          setIcon: () => {}
        };

        testTab = {
          url: 'https://www.testurl.com/test',
          id: 'test'
        };

        getActiveTabStub = sinon.stub(messageHandler.utils, 'getActiveTab');
        isExtensionOnStub = sinon.stub(messageHandler.utils, 'isExtensionOn');
        messageActiveTabStub = sinon.stub(messageHandler.utils, 'messageActiveTab');
        setIconStub = sinon.stub(chrome.browserAction, 'setIcon');

        getActiveTabStub.resolves(testTab);
      });

      afterEach(() => {
        getActiveTabStub.resetHistory();
        isExtensionOnStub.resetHistory();
        messageActiveTabStub.resetHistory();
        setIconStub.resetHistory();

        isExtensionOnStub.resolves(null);
      });

      after(() => {
        getActiveTabStub.restore();
        isExtensionOnStub.restore();
        messageActiveTabStub.restore();
        setIconStub.restore();
      });


      it('should message active tab to start and set active icon if extension is on', () => {
        isExtensionOnStub.resolves(true);
        return messageHandler.handleLoad()
          .then(() => {
            expect(getActiveTabStub.calledOnce).to.equal(true);
            expect(isExtensionOnStub.calledOnce).to.equal(true);
            expect(messageActiveTabStub.calledOnce).to.equal(true);
            expect(messageActiveTabStub.firstCall.args).to.deep.equal([{message: 'start'}]);
            expect(setIconStub.calledOnce).to.equal(true);
            expect(setIconStub.firstCall.args).to.deep.equal([{path: '../assets/static/active32.png', tabId: 'test'}]);
          });
      });

      it('should message active tab to stop and set inactive icon if extension if off', () => {
        isExtensionOnStub.resolves(false);
        return messageHandler.handleLoad()
          .then(() => {
            expect(getActiveTabStub.calledOnce).to.equal(true);
            expect(isExtensionOnStub.calledOnce).to.equal(true);
            expect(messageActiveTabStub.calledOnce).to.equal(true);
            expect(messageActiveTabStub.firstCall.args).to.deep.equal([{message: 'stop'}]);
            expect(setIconStub.calledOnce).to.equal(true);
            expect(setIconStub.firstCall.args).to.deep.equal([{path: '../assets/static/inactive32.png', tabId: 'test'}]);
          });
      });

      it('should callback with [null, null] if sendResponse callback provided', () => {
        const callbackStub = sinon.stub();
        return messageHandler.handleLoad(callbackStub)
          .then(() => {
            expect(callbackStub.calledOnce).to.equal(true);
            expect(callbackStub.firstCall.args).to.deep.equal([[null, null]]);
          })
      });

    });

    describe('handleFetchPlayers', () => {

      let apiGetStub;
      let dateNowStub;
      let saveToLocalStorageStub;
      let sendResponseSpy;

      before(() => {
        apiGetStub = sinon.stub(messageHandler, 'apiGet');
        dateNowStub = sinon.stub(Date, 'now').returns(0);
        saveToLocalStorageStub = sinon.stub(messageHandler.utils, 'saveToLocalStorage');

        apiGetStub.resolves(null);
        sendResponseSpy = sinon.spy();
      });

      afterEach(() => {
        apiGetStub.resolves(null);
        apiGetStub.resetHistory();
        saveToLocalStorageStub.resetHistory();
        sendResponseSpy.resetHistory();
      });

      after(() => {
        apiGetStub.restore();
        dateNowStub.restore();
        saveToLocalStorageStub.restore();
      });

      it('should save the time of this call to local storage', () => {
        return messageHandler.handleFetchPlayers(sendResponseSpy)
          .then(() => {
            expect(saveToLocalStorageStub.calledOnce).to.equal(true);
            expect(saveToLocalStorageStub.firstCall.args).to.deep.equal(['players-timestamp', 0]);
          })
      });

      it('should call apiGet with correct args', () => {
        const expectedArgs = ['players', 'all'];

        return messageHandler.handleFetchPlayers(sendResponseSpy)
          .then(() => {
            expect(apiGetStub.calledOnce).to.equal(true);
            expect(apiGetStub.firstCall.args).to.deep.equal(expectedArgs);
          });
      });

      describe('if apiGet resolves', () => {

        it('should send the response', () => {
          apiGetStub.resolves('response');
          return messageHandler.handleFetchPlayers(sendResponseSpy)
            .then(() => {
              expect(sendResponseSpy.calledOnce).to.equal(true);
              expect(sendResponseSpy.withArgs([null, 'response']).calledOnce).to.equal(true);
            });
        });

      });

      describe('if apiGet rejects', () => {

        it('should send the err', () => {
          apiGetStub.rejects('err');
          return messageHandler.handleFetchPlayers(sendResponseSpy)
            .then(() => {
              expect(sendResponseSpy.calledOnce).to.equal(true);
              expect(sendResponseSpy.firstCall.args[0][0].name).to.equal('err');
              expect(sendResponseSpy.firstCall.args[0][1]).to.equal(null);
            });
        });

      });

    });

    describe('apiGet', () => {

      let ajaxStub;

      before(() => {
        ajaxStub = sinon.stub($, 'ajax');
        ajaxStub.resolves(null);
      });

      afterEach(() => {
        ajaxStub.resetHistory();
      });

      after(() => {
        ajaxStub.restore();
      });

      it('should make an ajax request with the correct params', () => {
        const expectedArgs = [
          'http://clickandroll.co.uk/api/endpoint/id',
          {
            method: 'GET',
            cache: false,
            headers: {'x-click-and-roll': 'true'},
            timeout: 10000
          }
        ];

        return messageHandler.apiGet('endpoint', 'id')
          .then(() => {
            expect(ajaxStub.calledOnce).to.equal(true);
            expect(ajaxStub.firstCall.args).to.deep.equal(expectedArgs);
          });
      });

    });

    describe('handleFetchStats', () => {

      let getCacheRecordsStub;
      let statsInCacheAndCurrentStub;
      let getFromLocalStorageStub;
      let fetchNonCachedStatsStub;
      let cacheStatsStub;
      let sendResponseStub;

      before(() => {
        getCacheRecordsStub = sinon.stub(messageHandler, 'getCacheRecords');
        statsInCacheAndCurrentStub = sinon.stub(messageHandler, 'statsInCacheAndCurrent');
        getFromLocalStorageStub = sinon.stub(messageHandler.utils, 'getFromLocalStorage');
        fetchNonCachedStatsStub = sinon.stub(messageHandler, 'fetchNonCachedStats');
        cacheStatsStub = sinon.stub(messageHandler, 'cacheStats');
        sendResponseStub = sinon.stub();

        getCacheRecordsStub.resolves(null);
        statsInCacheAndCurrentStub.returns(false);
        getFromLocalStorageStub.resolves(null);
        fetchNonCachedStatsStub.resolves(null);
      });

      afterEach(() => {
        getCacheRecordsStub.resolves(null);
        statsInCacheAndCurrentStub.returns(false);
        getFromLocalStorageStub.resolves(null);
        fetchNonCachedStatsStub.resolves(null);

        getCacheRecordsStub.resetHistory();
        statsInCacheAndCurrentStub.resetHistory();
        getFromLocalStorageStub.resetHistory();
        fetchNonCachedStatsStub.resetHistory();
        cacheStatsStub.resetHistory();
        sendResponseStub.resetHistory();
      });

      after(() => {
        getCacheRecordsStub.restore();
        statsInCacheAndCurrentStub.restore();
        getFromLocalStorageStub.restore();
        fetchNonCachedStatsStub.restore();
        cacheStatsStub.restore();
      });

      it('should get cache records', () => {
        return messageHandler.handleFetchStats({playerId: 1}, sendResponseStub)
          .then(() => {
            expect(getCacheRecordsStub.calledOnce).to.equal(true);
          });
      });

      it('should check stats are in cache and current', () => {
        return messageHandler.handleFetchStats({playerId: 1}, sendResponseStub)
          .then(() => {
            expect(statsInCacheAndCurrentStub.called).to.equal(true);
            expect(statsInCacheAndCurrentStub.firstCall.args).to.deep.equal([null, 1]);
          });
      });

      it('should get stats from storage if in cache and current', () => {
        statsInCacheAndCurrentStub.returns(true);
        return messageHandler.handleFetchStats({playerId: 1}, sendResponseStub)
          .then(() => {
            expect(getFromLocalStorageStub.calledOnce).to.equal(true);
            expect(getFromLocalStorageStub.firstCall.args[0]).to.equal('player-1');
          });
      });

      it('should fetch stats from api if not in cache and current', () => {
        statsInCacheAndCurrentStub.returns(false);
        return messageHandler.handleFetchStats({playerId: 1}, sendResponseStub)
          .then(() => {
            expect(fetchNonCachedStatsStub.calledOnce).to.equal(true);
            expect(fetchNonCachedStatsStub.firstCall.args[0]).to.equal(1);
          });
      });

      it('should cache stats if they were not in cache and current', () => {
        fetchNonCachedStatsStub.resolves('stats');
        return messageHandler.handleFetchStats({playerId: 1}, sendResponseStub)
          .then(() => {
            expect(cacheStatsStub.calledOnce).to.equal(true);
            expect(cacheStatsStub.firstCall.args).to.deep.equal(['stats', 1, null]);
          });
      });

      it('should not cache stats if they were in cache and current', () => {
        statsInCacheAndCurrentStub.returns(true);
        return messageHandler.handleFetchStats({playerId: 1}, sendResponseStub)
          .then(() => {
            expect(cacheStatsStub.called).to.equal(false);
          });
      });

      it('should send stats in response if successful', () => {
        fetchNonCachedStatsStub.resolves('stats');
        return messageHandler.handleFetchStats({playerId: 1}, sendResponseStub)
          .then(() => {
            expect(sendResponseStub.calledOnce).to.equal(true);
            expect(sendResponseStub.firstCall.args[0]).to.deep.equal([null, 'stats'])
          });
      });

      it('should send error in response if unsuccessful', () => {
        fetchNonCachedStatsStub.rejects('err');
        return messageHandler.handleFetchStats({playerId: 1}, sendResponseStub)
          .then(() => {
            expect(sendResponseStub.calledOnce).to.equal(true);
            expect(sendResponseStub.firstCall.args[0][0].name).to.equal('err');
            expect(sendResponseStub.firstCall.args[0][1]).to.equal(null);
          })
      });

    });

    describe('getCacheRecords', () => {

      let getFromLocalStorageStub;
      let saveToLocalStorageStub;
      let cleanCacheStub;

      before(() => {
        getFromLocalStorageStub = sinon.stub(messageHandler.utils, 'getFromLocalStorage');
        saveToLocalStorageStub = sinon.stub(messageHandler.utils, 'saveToLocalStorage');
        cleanCacheStub = sinon.stub(messageHandler, 'cleanCache');

        getFromLocalStorageStub.resolves(null);
        saveToLocalStorageStub.resolves(null);
        cleanCacheStub.resolves(null);
      });

      afterEach(() => {
        getFromLocalStorageStub.resolves(null);
        cleanCacheStub.resolves(null);

        getFromLocalStorageStub.resetHistory();
        saveToLocalStorageStub.resetHistory();
        cleanCacheStub.resetHistory();
      });

      after(() => {
        getFromLocalStorageStub.restore();
        saveToLocalStorageStub.restore();
        cleanCacheStub.restore();
      });

      it('should request \'cache-records\' from local storage', () => {
        return messageHandler.getCacheRecords()
          .then(() => {
            expect(getFromLocalStorageStub.calledOnce).to.equal(true);
            expect(getFromLocalStorageStub.firstCall.args).to.deep.equal(['cache-records']);
          });
      });

      it('should return an empty array and save empty array to storage as \'cache-records\' if none fetched', () => {
        return messageHandler.getCacheRecords()
          .then(result => {
            expect(saveToLocalStorageStub.calledOnce).to.equal(true);
            expect(saveToLocalStorageStub.firstCall.args).to.deep.equal(['cache-records', []]);
            expect(result).to.deep.equal([]);
          });
      });

      it('should return cache-records if there are less than 50 records', () => {
        getFromLocalStorageStub.resolves(['records']);
        return messageHandler.getCacheRecords()
          .then(result => {
            expect(result).to.deep.equal(['records']);
          });
      });

      it('should invoke clean cache and return the result if there are over 100 records', () => {
        const records = [];
        const expectedRecords = [];

        for (let i = 0; i < 100; i++) {
          records.push(i);
          if (i < 50) expectedRecords.push(i);
        }

        getFromLocalStorageStub.resolves(records);
        cleanCacheStub.resolves(expectedRecords);

        return messageHandler.getCacheRecords()
          .then(result => {
            expect(result).to.deep.equal(expectedRecords);
          });
      });

    });

    describe('cleanCache', () => {

      let removeFromLocalStorageStub;

      before(() => {
        removeFromLocalStorageStub = sinon.stub(messageHandler.utils, 'removeFromLocalStorage');
      });

      afterEach(() => {
        removeFromLocalStorageStub.resetHistory();
      });

      after(() => {
        removeFromLocalStorageStub.restore();
      });

      it('should call remove from local storage as many times as half the length of the records', () => {
        messageHandler.cleanCache([0,1,2,3,4,5,6]);
        expect(removeFromLocalStorageStub.calledThrice).to.equal(true);
      });

      it('should return records from second half of the array', () => {
        const result = messageHandler.cleanCache([0,1,2,3,4,5,6,7,8,9]);
        expect(result).to.deep.equal([5,6,7,8,9]);
      });

    });

    describe('statsInCacheAndCurrent', () => {

      let dateNowStub;

      before(() => {
        dateNowStub = sinon.stub(Date, 'now').returns(3 * 60 * 60 * 1000);
      });

      after(() => {
        dateNowStub.restore();
      });

      it('should return false if cache is empty', () => {
        const result = messageHandler.statsInCacheAndCurrent([], 1);
        expect(result).to.equal(false);
      });

      it('should return false if cache has records but not current player', () => {
        const result = messageHandler.statsInCacheAndCurrent([{id: 2}], 1);
        expect(result).to.equal(false);
      });

      it('should return true if cache has records and player, timestamp is under three hours old, and player is inactive', () => {
        const result = messageHandler.statsInCacheAndCurrent([{id: 1, timestamp: 1, active: false}], 1);
        expect(result).to.equal(true);
      });

      it('should return true if cache has records and player, timestamp is under three hours old, and player is active', () => {
        const result = messageHandler.statsInCacheAndCurrent([{id: 1, timestamp: 1, active: true}], 1);
        expect(result).to.equal(true);
      });

      it('should return true if cache has records and player, timestamp is over three hours old, and player is inactive', () => {
        const result = messageHandler.statsInCacheAndCurrent([{id: 1, timestamp: 0, active: false}], 1);
        expect(result).to.equal(true);
      });

      it('should return false if cache has records and player, timestamp is over three hours old, and player is active', () => {
        const result = messageHandler.statsInCacheAndCurrent([{id: 1, timestamp: 0, active: true}], 1);
        expect(result).to.equal(false);
      });

    });

    describe('fetchNonCachedStats', () => {

      let applyRateLimitStub;
      let apiGetStub;
      let getActiveStub;
      let getCareerHTMLStub;
      let getProfileHTMLStub;
      let saveToStorageStub;

      const getStatsResponse = {
        rows: 'rows',
        profile: 'profile'
      };

      before(() => {
        applyRateLimitStub = sinon.stub(messageHandler, 'applyRateLimit');
        apiGetStub = sinon.stub(messageHandler, 'apiGet');
        getActiveStub = sinon.stub(messageHandler, 'getActive');
        getCareerHTMLStub = sinon.stub(messageHandler, 'getCareerHTML');
        getProfileHTMLStub = sinon.stub(messageHandler, 'getProfileHTML');
        saveToStorageStub = sinon.stub(messageHandler.utils, 'saveToLocalStorage');

        applyRateLimitStub.resolves(null);
        apiGetStub.resolves(getStatsResponse);
        getActiveStub.returns(true);
        getCareerHTMLStub.returns(null);
        getProfileHTMLStub.resolves(null);
        saveToStorageStub.returns(null);
      });

      afterEach(() => {
        applyRateLimitStub.resetHistory();
        apiGetStub.resetHistory();
        getActiveStub.resetHistory();
        getCareerHTMLStub.resetHistory();
        getProfileHTMLStub.resetHistory();
        saveToStorageStub.resetHistory();

        applyRateLimitStub.resolves(null);
        apiGetStub.resolves(getStatsResponse);
        getActiveStub.returns(true);
        getCareerHTMLStub.returns(null);
        getProfileHTMLStub.resolves(null);
        saveToStorageStub.returns(null);
      });

      after(() => {
        applyRateLimitStub.restore();
        apiGetStub.restore();
        getActiveStub.restore();
        getCareerHTMLStub.restore();
        getProfileHTMLStub.restore();
        saveToStorageStub.restore();
      });

      it('should call applyRateLimit', () => {
        return messageHandler.fetchNonCachedStats(1)
          .then(() => {
            expect(applyRateLimitStub.calledOnce).to.equal(true);
          })
      });

      describe('if applyRateLimit resolves', () => {

        it('should call apiGet with correct params', () => {
          const expectedArgs = ['player', 1];
          return messageHandler.fetchNonCachedStats(1)
            .then(() => {
              expect(apiGetStub.calledOnce).to.equal(true);
              expect(apiGetStub.firstCall.args).to.deep.equal(expectedArgs);
            })
        });

      });

      describe('if apiGet resolves', () => {

        it('should call getCareerHTML with returned rows', () => {
          return messageHandler.fetchNonCachedStats(1)
            .then(() => {
              expect(getCareerHTMLStub.calledOnce).to.equal(true);
              expect(getCareerHTMLStub.withArgs('rows').calledOnce).to.equal(true);
            })
        });

        it('should call getActive with returned rows', () => {
          return messageHandler.fetchNonCachedStats(1)
              .then(() => {
                expect(getActiveStub.calledOnce).to.equal(true);
                expect(getActiveStub.withArgs('rows').calledOnce).to.equal(true);
              })
        });

        it('should call getProfileHTML with returned profile', () => {
          return messageHandler.fetchNonCachedStats(1)
            .then(() => {
              expect(getProfileHTMLStub.calledOnce).to.equal(true);
              expect(getProfileHTMLStub.withArgs('profile').calledOnce).to.equal(true);
            })
        });

        describe('if getProfileHTML resolves', () => {

          it('should return stats with active flag, profile and career html', () => {
            getCareerHTMLStub.returns('careerStats');
            getProfileHTMLStub.resolves('profileStats');
            return messageHandler.fetchNonCachedStats(1)
              .then(result => {
                expect(result).to.deep.equal({id: 1, careerHTML: 'careerStats', profileHTML: 'profileStats', active: true});
              });
          });

        });

      });

    });

    describe('cacheStats', () => {

      let dateNowStub;
      let saveToLocalStorageStub;

      before(() => {
        dateNowStub = sinon.stub(Date, 'now');
        saveToLocalStorageStub = sinon.stub(messageHandler.utils, 'saveToLocalStorage');

        dateNowStub.returns(0);
      });

      afterEach(() => {
        saveToLocalStorageStub.resetHistory();
      });

      after(() => {
        dateNowStub.restore();
        saveToLocalStorageStub.restore();
      });

      it('should save two things to local storage', () => {
        messageHandler.cacheStats('stats', 1, []);
        expect(saveToLocalStorageStub.calledTwice).to.equal(true);
      });

      it('should save stats to storage under player id', () => {
        messageHandler.cacheStats('stats', 1, []);
        expect(saveToLocalStorageStub.firstCall.args).to.deep.equal(['player-1', 'stats']);
      });

      it('should save cache records to storage with new player and timestamp added', () => {
        messageHandler.cacheStats({active: true}, 1, []);
        expect(saveToLocalStorageStub.secondCall.args).to.deep.equal(['cache-records', [{id: 1, timestamp: 0, active: true}]]);
      });

    });

    describe('applyRateLimit', () => {

      let dateNowStub;
      let getFromLocalStorageStub;
      let setTimeoutSpy;

      before(() => {
        dateNowStub = sinon.stub(Date, 'now');
        getFromLocalStorageStub = sinon.stub(messageHandler.utils, 'getFromLocalStorage');
        setTimeoutSpy = sinon.spy(window, 'setTimeout');

        getFromLocalStorageStub.resolves(null);
        dateNowStub.returns(0);
      });

      afterEach(() => {
        getFromLocalStorageStub.resolves(null);
        dateNowStub.returns(0);

        getFromLocalStorageStub.resetHistory();
        dateNowStub.resetHistory();
        setTimeoutSpy.resetHistory();
      });

      after(() => {
        getFromLocalStorageStub.restore();
        dateNowStub.restore();
      });

      it('should call setTimeout with interval of 0 if last call was over one second ago', () => {
        dateNowStub.returns(1001);
        return messageHandler.applyRateLimit()
          .then(() => {
            expect(setTimeoutSpy.calledOnce).to.equal(true);
            expect(setTimeoutSpy.firstCall.args[1]).to.equal(0);
          });
      });

      it('should call setTimeout with difference between gap and three seconds if last call was under one second ago', () => {
        dateNowStub.returns(999);
        return messageHandler.applyRateLimit()
          .then(() => {
            expect(setTimeoutSpy.calledOnce).to.equal(true);
            expect(setTimeoutSpy.firstCall.args[1]).to.equal(1);
          });
      })

    });

    describe('getActive', () => {

      let dateStub;

      before(() => {
        dateStub = sinon.stub(Date.prototype, 'getFullYear');
        dateStub.returns(2020);
      });

      after(() => {
        dateStub.restore();
      });

      it('should return true if player has no seasons (they have just been drafted)', () => {
        const seasons = [];
        expect(messageHandler.getActive(seasons)).to.equal(true);
      });

      it('should return true if last season id starts with previous year', () => {
        const seasons = [{SEASON_ID: '2019-20'}, {}];
        expect(messageHandler.getActive(seasons)).to.equal(true);
      });

      it('should return true if last season id starts with current year', () => {
        const seasons = [{SEASON_ID: '2020-21'}, {}];
        expect(messageHandler.getActive(seasons)).to.equal(true);
      });

      it('should return false if last season id starts with year earlier than previous year', () => {
        const seasons = [{SEASON_ID: '2018-19'}, {}];
        expect(messageHandler.getActive(seasons)).to.equal(false);
      });

    });

    describe('getCareerHTML', () => {

      it('should return seasons as HTML string', () => {
        const rows = [{SEASON_ID: '2000-01', ALL_STAR: 1, TEAM_ABBREVIATION: 'TM', PLAYER_AGE: 20, FG_PCT: 0.5, FG3_PCT: 0, FT_PCT: 1}, {SEASON_ID: 'Career'}];

        const expected = '<tr><td class="season stick-left">2000-01<span style="color:gold; padding-left: 8px">&#9733;</span></td><td>TM</td><td>20</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>.500</td><td>n/a</td><td>n/a</td><td>.000</td><td>n/a</td><td>n/a</td><td>1.000</td><td>n/a</td></tr>' +
            '<tr class="career"><td class="season stick-left">Career</td><td>-</td><td>-</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td></tr>';
        expect(messageHandler.getCareerHTML(rows)).to.equal(expected);
      });

      it('should return empty string if player has no seasons', () => {
        const rows = [];
        expect(messageHandler.getCareerHTML(rows)).to.equal('');
      });

    });

    describe('getProfileHTML', () => {

      const profile = {
        DRAFT_YEAR: 'draftYear',
        DRAFT_ROUND: 'draftRound',
        DRAFT_NUMBER: 'draftNumber',
        BIRTHDAY: 'birthday',
        WEIGHT: 'weight',
        TEAM_ABBREVIATION: 'teamAbbreviation',
        NUMBER: 'number',
        POSITION: 'position',
        HEIGHT: 'height',
        COUNTRY: 'country',
        COLLEGE: 'college',
        NAME: 'name'
      };

      let formatDraftStub;
      let formatBirthdayStub;
      let formatHeightStub;
      let formatWeightStub;
      let getPlayerImageUrlStub;

      before(() => {
        formatDraftStub = sinon.stub(messageHandler, 'formatDraft');
        formatBirthdayStub = sinon.stub(messageHandler, 'formatBirthday');
        formatHeightStub = sinon.stub(messageHandler, 'formatHeight');
        formatWeightStub = sinon.stub(messageHandler, 'formatWeight');
        getPlayerImageUrlStub = sinon.stub(messageHandler, 'getPlayerImageUrl');

        formatDraftStub.returns('formattedDraft');
        formatBirthdayStub.returns('formattedBirthday');
        formatHeightStub.returns('formattedHeight');
        formatWeightStub.returns('formattedWeight');
        getPlayerImageUrlStub.returns('imageUrl');
      });

      afterEach(() => {
        formatDraftStub.resetHistory();
        formatBirthdayStub.resetHistory();
        formatHeightStub.resetHistory();
        formatWeightStub.resetHistory();
        getPlayerImageUrlStub.resetHistory();
      });

      after(() => {
        formatDraftStub.restore();
        formatBirthdayStub.restore();
        formatHeightStub.restore();
        formatWeightStub.restore();
        getPlayerImageUrlStub.restore();
      });

      it('should return correctly formatted player info', () => {
        const expected = '<img src ="imageUrl" alt="name" id="player-profile-image"/><div id="player-profile-info"><div class="info-label">Team</div><div class="info-data">teamAbbreviation</div><div class="info-label">Birthday</div><div class="info-data">formattedBirthday</div><div class="info-label">Country</div><div class="info-data">country</div><div class="info-label">Number</div><div class="info-data">number</div><div class="info-label">Height</div><div class="info-data">formattedHeight</div><div class="info-label">College</div><div class="info-data">college</div><div class="info-label">Position</div><div class="info-data">position</div><div class="info-label">Weight</div><div class="info-data">formattedWeight</div><div class="info-label">Draft</div><div class="info-data">formattedDraft</div></div>';

        return(messageHandler.getProfileHTML(profile))
          .then((result) => {
            expect(result).to.deep.equal(expected);
          });
      });

      it('should call formatting functions with correct values', () => {
        messageHandler.getProfileHTML(profile);
        expect(formatDraftStub.calledOnce).to.equal(true);
        expect(formatDraftStub.withArgs('draftYear', 'draftRound', 'draftNumber').calledOnce).to.equal(true);
        expect(formatBirthdayStub.calledOnce).to.equal(true);
        expect(formatBirthdayStub.withArgs('birthday').calledOnce).to.equal(true);
        expect(formatWeightStub.calledOnce).to.equal(true);
        expect(formatWeightStub.withArgs('weight').calledOnce).to.equal(true);
        expect(getPlayerImageUrlStub.calledOnce).to.equal(true);
        expect(getPlayerImageUrlStub.withArgs('name').calledOnce).to.equal(true);
      });

      it('should return \'n/a\' for unavailable values', () => {
        const profile = {
          DRAFT_YEAR: 'draftYear',
          DRAFT_ROUND: 'draftRound',
          DRAFT_NUMBER: 'draftNumber',
          BIRTHDAY: 'birthday',
          WEIGHT: 'weight',
          TEAM_ABBREVIATION: null,
          NUMBER: null,
          POSITION: null,
          HEIGHT: 'height',
          COUNTRY: null,
          COLLEGE: null,
          NAME: 'name'
        };

        const expected = '<img src ="imageUrl" alt="name" id="player-profile-image"/><div id="player-profile-info"><div class="info-label">Team</div><div class="info-data">n/a</div><div class="info-label">Birthday</div><div class="info-data">formattedBirthday</div><div class="info-label">Country</div><div class="info-data">n/a</div><div class="info-label">Number</div><div class="info-data">n/a</div><div class="info-label">Height</div><div class="info-data">formattedHeight</div><div class="info-label">College</div><div class="info-data">n/a</div><div class="info-label">Position</div><div class="info-data">n/a</div><div class="info-label">Weight</div><div class="info-data">formattedWeight</div><div class="info-label">Draft</div><div class="info-data">formattedDraft</div></div>';
        return(messageHandler.getProfileHTML(profile))
          .then(result => {
            expect(result).to.equal(expected);
          });
      })

    });

    describe('formatDraft', () => {

      describe('if draftYear is available', () => {

        it('should return formatted draft info', () => {
          expect(messageHandler.formatDraft('2000', '1', '1')).to.equal(
            '2000, Round 1, Pick 1'
          );
        });

        describe('if player went undrafted', () => {

          it('should return undrafted', () => {
            expect(messageHandler.formatDraft('Undrafted')).to.equal('Undrafted');
          });

        })

      });

      describe('if draftYear is unavailable', () => {

        it('should return \'n/a\'', () => {
          expect(messageHandler.formatDraft(null)).to.equal('n/a');
        });

      });

    });

    describe('formatBirthday', () => {

      describe('if birthday is available', () => {

        it('should return formatted birthday', () => {
          expect(messageHandler.formatBirthday('2000-01-01T00:00:00')).to.equal('2000-01-01');
        });

      });

      describe('if birthday is unavailable', () => {

        it('should return \'n/a\'', () => {
          expect(messageHandler.formatBirthday(null)).to.equal('n/a');
        });

      });

    });

    describe('formatHeight', () => {

      it('should return formatted height if available', () => {
        expect(messageHandler.formatHeight('6-7')).to.equal('6-7 (2.01 m)');
      });

      it('should return \'n/a\' if unavailable', () => {
        expect(messageHandler.formatHeight(null)).to.equal('n/a');
      });

    });

    describe('formatWeight', () => {

      it('should return formatted weight if available', () => {
        expect(messageHandler.formatWeight('200')).to.equal('200 lb (91 kg)');
      });

      it('should return \'n/a\' if unavailable', () => {
        expect(messageHandler.formatWeight(null)).to.equal('n/a');
      });

    });

    describe('getPlayerImageUrl', () => {

      let getDateStringStub;

      before(() => {
        getDateStringStub = sinon.stub(messageHandler, 'getDateString');
        getDateStringStub.returns('dateString');
      });

      afterEach(() => {
        getDateStringStub.resetHistory();
      });

      after(() => {
        getDateStringStub.restore();
      });

      describe('if player name is not in image reference map', () => {

        it('should return url with default player reference number', () => {
          expect(messageHandler.getPlayerImageUrl('LeBron James')).to.equal(
            'https://d2cwpp38twqe55.cloudfront.net/req/dateString1/images/players/jamesle01.jpg'
          );
        })

      });

      describe('if player name is in image reference map', () => {

        it('should return url with player reference number in map', () => {
          expect(messageHandler.getPlayerImageUrl('Anthony Davis')).to.equal(
            'https://d2cwpp38twqe55.cloudfront.net/req/dateString1/images/players/davisan02.jpg'
          );
        })

      });

    });

    describe('getDateString', () => {

      const date = new Date();
      let getFullYearStub;
      let getMonthStub;
      let getDateStub;

      before(() => {
        getFullYearStub = sinon.stub(date, 'getFullYear');
        getMonthStub = sinon.stub(date, 'getMonth');
        getDateStub = sinon.stub(date, 'getDate');

        getFullYearStub.returns(null);
        getFullYearStub.returns(null);
        getFullYearStub.returns(null);
      });

      afterEach(() => {
        getFullYearStub.returns(null);
        getFullYearStub.returns(null);
        getFullYearStub.returns(null);

        getFullYearStub.resetHistory();
        getMonthStub.resetHistory();
        getDateStub.resetHistory();
      });

      after(() => {
        getFullYearStub.restore();
        getMonthStub.restore();
        getDateStub.restore();
      });

      it('should return full date as formatted string with month incremented by 1', () => {
        getFullYearStub.returns(2000);
        getMonthStub.returns(10);
        getDateStub.returns(10);
        expect(messageHandler.getDateString(date)).to.equal('20001110');
      });

      it('should 0 pad months and dates below 10', () => {
        getFullYearStub.returns(2000);
        getMonthStub.returns(8);
        getDateStub.returns(9);
        expect(messageHandler.getDateString(date)).to.equal('20000909');
      });

    });

  });

});
