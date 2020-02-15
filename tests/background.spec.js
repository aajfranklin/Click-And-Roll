describe('Background Scripts', () => {

  describe('MessageHandler', () => {

    const messageHandler = new MessageHandler();

    describe('addListeners', () => {
      let handleLoadStub;
      let onBeforeSendHeadersStub;
      let onMessageStub;
      let onActivatedStub;

      before(() => {

        chrome.webRequest = {onBeforeSendHeaders: {addListener: () => {}}};
        chrome.runtime.onMessage = {addListener: () => {}};
        chrome.tabs = {onActivated: {addListener: () => {}}};

        handleLoadStub = sinon.stub(messageHandler, 'handleLoad');
        onBeforeSendHeadersStub = sinon.stub(chrome.webRequest.onBeforeSendHeaders, 'addListener');
        onMessageStub = sinon.stub(chrome.runtime.onMessage, 'addListener');
        onActivatedStub = sinon.stub(chrome.tabs.onActivated, 'addListener');

        handleLoadStub.returns(null);
        onBeforeSendHeadersStub.returns(null);
        onMessageStub.returns(null);
        onActivatedStub.returns(null);
      });

      afterEach(() => {
        handleLoadStub.resetHistory();
        onBeforeSendHeadersStub.resetHistory();
        onMessageStub.resetHistory();
        onActivatedStub.resetHistory();
      });

      after(() => {
        handleLoadStub.restore();
        onBeforeSendHeadersStub.restore();
        onMessageStub.restore();
        onActivatedStub.restore();
      });

      it('should call chrome runtime on message add listener with correct listener', () => {
        const onBeforeSendHeadersArgs = [messageHandler.setRequestHeaders, {urls: ['https://stats.nba.com/stats/*']}, ['requestHeaders', 'blocking', 'extraHeaders']];

        messageHandler.addListeners();
        expect(onBeforeSendHeadersStub.calledOnce).to.equal(true);
        expect(onBeforeSendHeadersStub.firstCall.args).to.deep.equal(onBeforeSendHeadersArgs);
        expect(onMessageStub.calledOnce).to.equal(true);
        expect(onMessageStub.firstCall.args[0]).to.equal(messageHandler.handleMessage);
        expect(onActivatedStub.calledOnce).to.equal(true);
        expect(handleLoadStub.calledOnce).to.equal(false);
        onActivatedStub.firstCall.args[0]();
        expect(handleLoadStub.calledOnce).to.equal(true);
      });

    });

    describe('setRequestHeaders', () => {

      it ('should change the referer if present', () => {
        const webRequestDetails = {
          requestHeaders: [
            {name: 'someHeader', value: 'someValue'},
            {name: 'Referer', value: 'http://test'}
          ]
        };

        const expected = {requestHeaders: [
          {name: 'someHeader', value: 'someValue'},
          {name: 'Referer', value: 'https://stats.nba.com'},
          {name: 'x-nba-stats-origin', value: 'stats'},
          {name: 'x-nba-stats-token', value: 'true'}
        ]};

        const result = messageHandler.setRequestHeaders(webRequestDetails);
        expect(result).to.deep.equal(expected);
      });

      it ('add the referer if not present', () => {
        const webRequestDetails = {
          requestHeaders: [
            {name: 'someHeader', value: 'someValue'},
          ]
        };

        const expected = {requestHeaders: [
            {name: 'someHeader', value: 'someValue'},
            {name: 'Referer', value: 'https://stats.nba.com'},
            {name: 'x-nba-stats-origin', value: 'stats'},
            {name: 'x-nba-stats-token', value: 'true'}
          ]};

        const result = messageHandler.setRequestHeaders(webRequestDetails);
        expect(result).to.deep.equal(expected);
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

      let fetchPlayersStub;
      let formatPlayersStub;
      let sendResponseSpy;

      before(() => {
        fetchPlayersStub = sinon.stub(messageHandler, 'fetchPlayers');
        formatPlayersStub = sinon.stub(messageHandler, 'formatPlayers');

        fetchPlayersStub.resolves(null);
        formatPlayersStub.returns(null);

        sendResponseSpy = sinon.spy();
      });

      afterEach(() => {
        fetchPlayersStub.resolves(null);

        fetchPlayersStub.resetHistory();
        formatPlayersStub.resetHistory();

        sendResponseSpy.resetHistory();
      });

      after(() => {
        fetchPlayersStub.restore();
        formatPlayersStub.restore();
      });

      it('should call fetchPlayers', () => {
        return messageHandler.handleFetchPlayers(sendResponseSpy)
          .then(() => {
            expect(fetchPlayersStub.calledOnce).to.equal(true);
          });
      });

      describe('if fetchPlayers resolves', () => {

        it('should pass fetchPlayers response to formatPlayers', () => {
          fetchPlayersStub.resolves('response');
          return messageHandler.handleFetchPlayers(sendResponseSpy)
            .then(() => {
              expect(formatPlayersStub.calledOnce).to.equal(true);
              expect(formatPlayersStub.withArgs('response').calledOnce).to.equal(true);
            });
        });

        it('should send the response', () => {
          fetchPlayersStub.resolves('response');
          formatPlayersStub.returns('players');
          return messageHandler.handleFetchPlayers(sendResponseSpy)
            .then(() => {
              expect(sendResponseSpy.calledOnce).to.equal(true);
              expect(sendResponseSpy.withArgs([null, 'players']).calledOnce).to.equal(true);
            });
        });

      });

      describe('if fetchPlayers rejects', () => {

        it('should send the err', () => {
          fetchPlayersStub.rejects('err');
          return messageHandler.handleFetchPlayers(sendResponseSpy)
            .then(() => {
              expect(sendResponseSpy.calledOnce).to.equal(true);
              expect(sendResponseSpy.firstCall.args[0][0].name).to.equal('err');
              expect(sendResponseSpy.firstCall.args[0][1]).to.equal(null);
            });
        });

      });

    });

    describe('fetchPlayers', () => {

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
        return messageHandler.fetchPlayers()
          .then(() => {
            expect(ajaxStub.withArgs(
              'https://stats.nba.com/stats/commonallplayers',
              {
                method: 'GET',
                data: {
                  LeagueID: '00',
                  Season: '2018-19',
                  IsOnlyCurrentSeason: '0'
                },
                cache: false
              }
            ).calledOnce).to.equal(true);
          });
      });

    });

    describe('formatPlayers', () => {

      it('should return only array of objects with id and name', () => {
        const fetchedPlayers = {
          resultSets: [
            {
              rowSet: [
                ['id1', 'otherValue', 'player1'],
                ['id2', 'otherValue', 'player2']
              ]
            }
          ]
        };
        const result = messageHandler.formatPlayers(fetchedPlayers);
        expect(result.length).to.equal(2);
        expect(result[0]).to.deep.equal({id:'id1', name:'player1'});
        expect(result[1]).to.deep.equal({id:'id2', name:'player2'});
      });

    });

    describe('handleFetchStats', () => {

      it('should fail', () => {
        expect(false).to.equal(true);
      })

    });

    describe('getCacheRecords', () => {

      it('should fail', () => {
        expect(false).to.equal(true);
      })

    });

    describe('areStatsInCacheAndCurrent', () => {

      let dateNowStub;

      before(() => {
        dateNowStub = sinon.stub(Date, 'now').returns(3 * 60 * 60 * 1000);
      });

      after(() => {
        dateNowStub.restore();
      });

      it('should return false if cache is empty', () => {
        const result = messageHandler.areStatsInCacheAndCurrent([], 1);
        expect(result).to.equal(false);
      });

      it('should return false if cache has records but not current player', () => {
        const result = messageHandler.areStatsInCacheAndCurrent([{id: 2}], 1);
        expect(result).to.equal(false);
      });

      it('should return false if cache has records and player but timestamp is over three hours old', () => {
        const result = messageHandler.areStatsInCacheAndCurrent([{id: 1, timestamp: 0}], 1);
        expect(result).to.equal(false);
      });

      it('should return true if cache has records and current player', () => {
        const result = messageHandler.areStatsInCacheAndCurrent([{id: 1, timestamp: 1}], 1);
        expect(result).to.equal(true);
      });

    });

    describe('fetchCachedStats', () => {

      it('should fail', () => {
        expect(false).to.equal(true);
      })

    });

    describe('fetchNonCachedStats', () => {

      let applyRateLimitStub;
      let fetchCareerStatsStub;
      let fetchCommonPlayerInfoStub;
      let getCareerHTMLStub;
      let getProfileHTMLStub;
      let saveToStorageStub;

      before(() => {
        applyRateLimitStub = sinon.stub(messageHandler, 'applyRateLimit');
        fetchCareerStatsStub = sinon.stub(messageHandler, 'fetchCareerStats');
        fetchCommonPlayerInfoStub = sinon.stub(messageHandler, 'fetchCommonPlayerInfo');
        getCareerHTMLStub = sinon.stub(messageHandler, 'getCareerHTML');
        getProfileHTMLStub = sinon.stub(messageHandler, 'getProfileHTML');
        saveToStorageStub = sinon.stub(messageHandler.utils, 'saveToLocalStorage');

        applyRateLimitStub.resolves(null);
        fetchCareerStatsStub.resolves(null);
        fetchCommonPlayerInfoStub.resolves(null);
        getCareerHTMLStub.returns(null);
        getProfileHTMLStub.resolves(null);
        saveToStorageStub.returns(null);
      });

      afterEach(() => {
        applyRateLimitStub.resetHistory();
        fetchCareerStatsStub.resetHistory();
        fetchCommonPlayerInfoStub.resetHistory();
        getCareerHTMLStub.resetHistory();
        getProfileHTMLStub.resetHistory();
        saveToStorageStub.resetHistory();

        applyRateLimitStub.resolves(null);
        fetchCareerStatsStub.resolves(null);
        fetchCommonPlayerInfoStub.resolves(null);
        getCareerHTMLStub.returns(null);
        getProfileHTMLStub.resolves(null);
        saveToStorageStub.returns(null);
      });

      after(() => {
        applyRateLimitStub.restore();
        fetchCareerStatsStub.restore();
        fetchCommonPlayerInfoStub.restore();
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

        it('should call fetchCareerStats with request playerId', () => {
          return messageHandler.fetchNonCachedStats(1)
            .then(() => {
              expect(fetchCareerStatsStub.calledOnce).to.equal(true);
              expect(fetchCareerStatsStub.withArgs(1).calledOnce).to.equal(true);
            })
        });

      });

      describe('if fetchCareerStats resolves', () => {

        it('should call getCareerHTML with fetchCareerStats response', () => {
          fetchCareerStatsStub.resolves('careerStats');
          return messageHandler.fetchNonCachedStats(1)
            .then(() => {
              expect(getCareerHTMLStub.calledOnce).to.equal(true);
              expect(getCareerHTMLStub.withArgs('careerStats').calledOnce).to.equal(true);
            })
        });

        it('should call fetchCommonPlayerInfo with request playerId', () => {
          return messageHandler.fetchNonCachedStats(1)
            .then(() => {
              expect(fetchCommonPlayerInfoStub.calledOnce).to.equal(true);
              expect(fetchCommonPlayerInfoStub.withArgs(1).calledOnce).to.equal(true);
            })
        });

        describe('if fetchCommonPlayerInfo resolves', () => {

          it('should call getProfileHTML with fetchCommonPlayerInfo response', () => {
            fetchCommonPlayerInfoStub.resolves('commonPlayerInfo');
            return messageHandler.fetchNonCachedStats(1)
              .then(() => {
                expect(getProfileHTMLStub.calledOnce).to.equal(true);
                expect(getProfileHTMLStub.withArgs('commonPlayerInfo').calledOnce).to.equal(true);
              })
          });

          describe('if getProfileHTML resolves', () => {

            it('should return stats', () => {
              getCareerHTMLStub.returns('careerStats');
              getProfileHTMLStub.resolves('profileStats');
              return messageHandler.fetchNonCachedStats(1)
                .then(result => {
                  expect(result).to.deep.equal({id: 1, careerHTML: 'careerStats', profileHTML: 'profileStats'});
                });
            });

          });

        });

      });

    });

    describe('applyRateLimit', () => {

      let dateNowStub;
      let setTimeoutSpy;

      before(() => {
        dateNowStub = sinon.stub(Date, 'now');
        setTimeoutSpy = sinon.spy(window, 'setTimeout');

        dateNowStub.returns(0);
      });

      afterEach(() => {
        dateNowStub.returns(0);

        dateNowStub.resetHistory();
        setTimeoutSpy.resetHistory();
      });

      after(() => {
        dateNowStub.restore();
      });

      it('should call setTimeout with interval of 0 if last call was over three seconds ago', () => {
        dateNowStub.returns(3001);

        chrome.storage = {
          local: {
            get: (timestamp, callback) => callback({timestamp: 0})
          }
        };

        return messageHandler.applyRateLimit()
          .then(() => {
            expect(setTimeoutSpy.calledOnce).to.equal(true);
            expect(setTimeoutSpy.firstCall.args[1]).to.equal(0);
          });
      });

      it('should call setTimeout with difference between gap and three seconds if last call was under three seconds ago', () => {
        dateNowStub.returns(2999);

        chrome.storage = {
          local: {
            get: (timestamp, callback) => callback({timestamp: 0})
          }
        };

        return messageHandler.applyRateLimit()
          .then(() => {
            expect(setTimeoutSpy.calledOnce).to.equal(true);
            expect(setTimeoutSpy.firstCall.args[1]).to.equal(1);
          });
      })

    });

    describe('fetchCareerStats', () => {

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
        return messageHandler.fetchCareerStats(1)
          .then(() => {
            expect(ajaxStub.withArgs(
            'https://stats.nba.com/stats/playercareerstats',
              {
                method: 'GET',
                data: {
                  LeagueID: '00',
                  PerMode: 'PerGame',
                  PlayerID: 1
                },
                cache: false
              }
            ).calledOnce).to.equal(true);
          });
      });

    });

    describe('getCareerHTML', () => {

      it('should return seasons as HTML string', () => {
        const response = {
          "resource": "playercareerstats",
          "parameters": {
            "PerMode": "PerGame",
            "PlayerID": 0,
            "LeagueID": "00"
          },
          "resultSets": [{
            "name": "SeasonTotalsRegularSeason",
            "headers": ["PLAYER_ID", "SEASON_ID", "LEAGUE_ID", "TEAM_ID", "TEAM_ABBREVIATION", "PLAYER_AGE", "GP"],
            "rowSet": [
              [0, "2003-04", "00", 1, "TST", 19.0, 82],
              [0,"2004-05", "00", 1, "TST", 20.0, 82]
            ]
          }, {
            "name": "CareerTotalsRegularSeason",
            "headers": ["PLAYER_ID", "LEAGUE_ID", "Team_ID", "GP"],
            "rowSet": [[0, "00", 0, 164]]
          }, {
            "name": "SeasonTotalsAllStarSeason",
            "headers": ["PLAYER_ID", "SEASON_ID"],
            "rowSet": [[0, "2004-05",]]
          }, {
            "name": "other"
          }]
        };

        const expected = '<tr><td class="season stick-left">2003-04</td><td>TST</td><td>19</td><td>82</td></tr>'
          + '<tr><td class="season stick-left">2004-05<span style="color:gold; padding-left: 8px">&#9733;</span></td><td>TST</td><td>20</td><td>82</td></tr>'
          + '<tr class="career"><td class="season stick-left">Career</td><td>-</td><td>-</td><td>164</td></tr>';

        expect(messageHandler.getCareerHTML(response)).to.equal(expected);
      });

      it('should return empty string if player has no seasons', () => {
        const response = {
          "resource": "playercareerstats",
          "parameters": {
            "PerMode": "PerGame",
            "PlayerID": 0,
            "LeagueID": "00"
          },
          "resultSets": [{
            "name": "SeasonTotalsRegularSeason",
            "headers": [],
            "rowSet": []
          }, {
            "name": "CareerTotalsRegularSeason",
            "headers": [],
            "rowSet": []
          }, {
            "name": "SeasonTotalsAllStarSeason",
            "headers": [],
            "rowSet": []
          }, {
            "name": "other"
          }]
        };

        expect(messageHandler.getCareerHTML(response)).to.equal('');
      });

    });

    describe('fetchCommonPlayerInfo', () => {

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
        return messageHandler.fetchCommonPlayerInfo(1)
          .then(() => {
            expect(ajaxStub.withArgs(
              'https://stats.nba.com/stats/commonplayerinfo',
              {
                method: 'GET',
                data: {
                  LeagueID: '00',
                  PlayerID: 1
                },
                cache: false
              },
            ).calledOnce).to.equal(true);
          });
      });

    });

    describe('getProfileHTML', () => {

      const response = {
        resultSets: [
          {
            headers: [
              'DRAFT_YEAR',
              'DRAFT_ROUND',
              'DRAFT_NUMBER',
              'BIRTHDATE',
              'WEIGHT',
              'TEAM_ABBREVIATION',
              'JERSEY',
              'POSITION',
              'HEIGHT',
              'COUNTRY',
              'SCHOOL',
              'DISPLAY_FIRST_LAST'
            ],
            rowSet: [
              ['draftYear',
              'draftRound',
              'draftNumber',
              'birthDate',
              'weight',
              'teamAbbreviation',
              'jersey',
              'position',
              'height',
              'country',
              'school',
              'displayName']
            ]
          }
        ]
      };

      let formatDraftStub;
      let formatBirthdayStub;
      let formatWeightStub;
      let getPlayerImageUrlStub;

      before(() => {
        formatDraftStub = sinon.stub(messageHandler, 'formatDraft');
        formatBirthdayStub = sinon.stub(messageHandler, 'formatBirthday');
        formatWeightStub = sinon.stub(messageHandler, 'formatWeight');
        getPlayerImageUrlStub = sinon.stub(messageHandler, 'getPlayerImageUrl');

        formatDraftStub.returns('formattedDraft');
        formatBirthdayStub.returns('formattedBirthday');
        formatWeightStub.returns('formattedWeight');
        getPlayerImageUrlStub.returns('imageUrl');
      });

      afterEach(() => {
        formatDraftStub.resetHistory();
        formatBirthdayStub.resetHistory();
        formatWeightStub.resetHistory();
        getPlayerImageUrlStub.resetHistory();
      });

      after(() => {
        formatDraftStub.restore();
        formatBirthdayStub.restore();
        formatWeightStub.restore();
        getPlayerImageUrlStub.restore();
      });

      it('should return correctly formatted player info', () => {
        const expected = '<img src ="imageUrl" alt="displayName" id="player-profile-image"/><div id="player-profile-info"><div class="info-label">Team</div><div class="info-data">teamAbbreviation</div><div class="info-label">Birthday</div><div class="info-data">formattedBirthday</div><div class="info-label">Country</div><div class="info-data">country</div><div class="info-label">Number</div><div class="info-data">jersey</div><div class="info-label">Height</div><div class="info-data">height</div><div class="info-label">College</div><div class="info-data">school</div><div class="info-label">Position</div><div class="info-data">position</div><div class="info-label">Weight</div><div class="info-data">formattedWeight</div><div class="info-label">Draft</div><div class="info-data">formattedDraft</div></div>';

        return(messageHandler.getProfileHTML(response))
          .then((result) => {
            expect(result).to.deep.equal(expected);
          });
      });

      it('should call formatting functions with correct values', () => {
        messageHandler.getProfileHTML(response);
        expect(formatDraftStub.calledOnce).to.equal(true);
        expect(formatDraftStub.withArgs('draftYear', 'draftRound', 'draftNumber').calledOnce).to.equal(true);
        expect(formatBirthdayStub.calledOnce).to.equal(true);
        expect(formatBirthdayStub.withArgs('birthDate').calledOnce).to.equal(true);
        expect(formatWeightStub.calledOnce).to.equal(true);
        expect(formatWeightStub.withArgs('weight').calledOnce).to.equal(true);
        expect(getPlayerImageUrlStub.calledOnce).to.equal(true);
        expect(getPlayerImageUrlStub.withArgs('displayName').calledOnce).to.equal(true);
      });

      it('should return \'n/a\' for unavailable values', () => {
        const responseWithNullValues = {
          resultSets: [
            {
              headers: [
                'DRAFT_YEAR',
                'DRAFT_ROUND',
                'DRAFT_NUMBER',
                'BIRTHDATE',
                'WEIGHT',
                'TEAM_ABBREVIATION',
                'JERSEY',
                'POSITION',
                'HEIGHT',
                'COUNTRY',
                'SCHOOL',
                'DISPLAY_FIRST_LAST'
              ],
              rowSet: [
                ['draftYear',
                  'draftRound',
                  'draftNumber',
                  'birthDate',
                  'weight',
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  'displayName']
              ]
            }
          ]
        };
        const expected = '<img src ="imageUrl" alt="displayName" id="player-profile-image"/><div id="player-profile-info"><div class="info-label">Team</div><div class="info-data">n/a</div><div class="info-label">Birthday</div><div class="info-data">formattedBirthday</div><div class="info-label">Country</div><div class="info-data">n/a</div><div class="info-label">Number</div><div class="info-data">n/a</div><div class="info-label">Height</div><div class="info-data">n/a</div><div class="info-label">College</div><div class="info-data">n/a</div><div class="info-label">Position</div><div class="info-data">n/a</div><div class="info-label">Weight</div><div class="info-data">formattedWeight</div><div class="info-label">Draft</div><div class="info-data">formattedDraft</div></div>';
        return(messageHandler.getProfileHTML(responseWithNullValues))
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

    describe('formatWeight', () => {

      describe('if weight is available', () => {

        it('should return formatted weight', () => {
          expect(messageHandler.formatWeight('200')).to.equal('200 lb');
        });

      });

      describe('if weight is unavailable', () => {

        it('should return \'n/a\'', () => {
          expect(messageHandler.formatWeight(null)).to.equal('n/a');
        });

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
