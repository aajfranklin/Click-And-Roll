
describe('Content Scripts', () => {

  describe('Utils', () => {

    const testUtils = new Utils();

    describe('checkPlayers', () => {

      let saveToChromeStorageStub;
      let backgroundScriptRequestStub;
      const fetchedPlayers = 'mockFetchedPlayers';
      const cachedPlayers = {players: 'mockCachedPlayers'};

      before(() => {
        saveToChromeStorageStub = sinon.stub(testUtils, 'saveToChromeStorage');
        backgroundScriptRequestStub = sinon.stub(testUtils, 'fetchRequest');
        backgroundScriptRequestStub.resolves(fetchedPlayers);
      });

      afterEach(() => {
        saveToChromeStorageStub.resetHistory();
        backgroundScriptRequestStub.resetHistory();
      });

      after(() => {
        saveToChromeStorageStub.restore();
        backgroundScriptRequestStub.restore();
      });

      it('should return players fetched from storage if they are present', () => {
        return testUtils.checkPlayers(cachedPlayers)
          .then((response) => {
            expect(backgroundScriptRequestStub.notCalled).to.equal(true);
            expect(saveToChromeStorageStub.notCalled).to.equal(true);
            expect(response).to.equal('mockCachedPlayers')
          })
      });

      it('should fetch and store players if they are not in local chrome storage', () => {
        return testUtils.checkPlayers(undefined)
          .then((response) => {
            expect(backgroundScriptRequestStub.withArgs({message: 'fetchPlayers'}).calledOnce).to.equal(true);
            expect(saveToChromeStorageStub.withArgs('players', fetchedPlayers).calledOnce).to.equal(true);
            expect(response).to.equal(fetchedPlayers);
          })
      });

    });

    describe('fetchRequest', () => {

      let sendMessageStub;
      let request = {message: 'testRequest'};
      let response;

      before(() => {
        response = [null, 'res'];
        sendMessageStub = sinon.stub(chrome.runtime, 'sendMessage');
        sendMessageStub.callsArgWith(1, response);
      });

      afterEach(() => {
        sendMessageStub.resetHistory();
      });

      after(() => {
        sendMessageStub.restore();
      });

      it('should send a message to chrome runtime with passed in request', () => {
        return testUtils.fetchRequest(request)
          .then(() => {
            expect(sendMessageStub.calledOnce).to.equal(true);
            expect(sendMessageStub.withArgs(request).calledOnce).to.equal(true);
          });
      });

      it('should resolve response if chrome returns no error', () => {
        return testUtils.fetchRequest(request)
          .then((res) => {
            expect(res).to.equal('res');
          });
      });

      it('should reject if chrome returns an error', () => {
        response = ['err', null];
        sendMessageStub.callsArgWith(1, response);

        return testUtils.fetchRequest(request)
          .catch((err) => {
            expect(err).to.equal('err');
          })
      });

    });

    describe('saveToChromeStorage', () => {

      let chromeStorageLocalSetSpy;
      let consoleLogSpy;

      before(() => {
        chrome.storage = {
          local: {
            set: (input, callback) => callback()
          }
        };

        chromeStorageLocalSetSpy = sinon.spy(chrome.storage.local, 'set');
        consoleLogSpy = sinon.spy(console, 'log');
      });

      afterEach(() => {
        chromeStorageLocalSetSpy.resetHistory();
        consoleLogSpy.resetHistory();
      });

      after(() => {
        chromeStorageLocalSetSpy.restore();
        consoleLogSpy.restore();
        delete chrome.storage;
      });

      it('should call set on chrome local storage with passed in name and values', () => {
        testUtils.saveToChromeStorage('testName', ['testValues']);
        expect(chromeStorageLocalSetSpy.calledOnce).to.equal(true);
        expect(chromeStorageLocalSetSpy.withArgs({['testName']: ['testValues']}).calledOnce).to.equal(true);
      });

      it('should log that players have been saved', () => {
        testUtils.saveToChromeStorage('testName', ['testValues']);
        expect(consoleLogSpy.calledOnce).to.equal(true);
        expect(consoleLogSpy.withArgs('testName saved').calledOnce).to.equal(true);
      });

    });

  });

  describe('ResultSearch', () => {

    const testResultSearch = new ResultSearch();

    describe('setSearchStrings', () => {

      let searchStrings;

      before(() => {
        searchStrings = ['LeBron James', 'Michael Jordan'];
        testResultSearch.setSearchStrings(searchStrings);
      });

      it('should set search strings to the passed in value', () => {
        expect(testResultSearch.searchStrings).to.deep.equal(searchStrings);
      });

    });

    describe('searchRootNode', () => {

      let filterOverlappingStringsStub;
      let mapHitsToResultNodesStub;
      let rootNode;
      let searchTextStub;

      before(() => {
        rootNode = {
          textContent: 'textContent'
        };

        filterOverlappingStringsStub = sinon.stub(testResultSearch, 'filterOverlappingStrings');
        mapHitsToResultNodesStub = sinon.stub(testResultSearch, 'mapHitsToResultNodes');
        searchTextStub = sinon.stub(testResultSearch, 'searchText');

        filterOverlappingStringsStub.returns('filteredHits');
        mapHitsToResultNodesStub.returns(null);
        searchTextStub.returns('hits');

        testResultSearch.searchRootNode(rootNode);
      });

      after(() => {
        filterOverlappingStringsStub.restore();
        mapHitsToResultNodesStub.restore();
        searchTextStub.restore();
      });

      it('should call searchText with text content of passed in node', () => {
        expect(searchTextStub.calledOnce).to.equal(true);
        expect(searchTextStub.withArgs('textContent').calledOnce).to.equal(true);
      });

      it('should pass search text hits to filterOverLappingStrings', () => {
        expect(filterOverlappingStringsStub.calledOnce).to.equal(true);
        expect(filterOverlappingStringsStub.withArgs('hits').calledOnce).to.equal(true);
      });

      it('should pass node and filtered hits to mapHitsToResultNodes', () => {
        expect(mapHitsToResultNodesStub.calledOnce).to.equal(true);
        expect(mapHitsToResultNodesStub.withArgs(rootNode, 'filteredHits').calledOnce).to.equal(true);      });

    });

    describe('searchText', () => {

      it('should return start index, end index, and name of matched players', () => {
        const text = 'LeBron James Michael Jordan';
        const expectedResult = [
          {start: 0, end: 11, text: 'LeBron James'},
          {start: 13, end: 26, text: 'Michael Jordan'}
        ];
        expect(testResultSearch.searchText(text)).to.deep.equal(expectedResult);
      });

    });

    describe('filterOverlappingStrings', () => {

      it('should remove sub strings', () => {
        const hits = [
          {start: 2, end: 14, text: 'Marcus Cousin'},
          {start: 0, end: 15, text: 'DeMarcus Cousins'}
        ];

        const filteredHits = testResultSearch.filterOverlappingStrings(hits);
        expect(filteredHits.length === 1);
        expect(filteredHits[0]).to.deep.equal(hits[1]);
      });

      it('should remove partly overlapping strings', () => {
        const hits = [
          {start: 0, end: 11, text: 'LeBron James'},
          {start: 7, end: 18, text: 'James Harden'}
        ];

        const filteredHits = testResultSearch.filterOverlappingStrings(hits);
        expect(filteredHits.length === 1);
        expect(filteredHits[0]).to.deep.equal(hits[1]);
      });

    });

    describe('mapHitsToResultNodes', () => {

      let hit;
      let hits;
      let mockTreeWalker;
      let offsetHit;

      let createResultNodeStub;
      let createTreeWalkerStub;
      let nextHitStub;
      let nextNodeStub;
      let parentNodeIsValidStub;

      before(() => {
        hit = {start: 0, end: 11, text: 'LeBron James'};
        hits = [];
        mockTreeWalker = {
          currentNode: {
            nodeName: null,
            textContent: null
          },
          nextNode: () => {}
        };
        offsetHit = {start: 4, end: 15, text: 'LeBron James'};

        createResultNodeStub = sinon.stub(testResultSearch, 'createResultNode');
        createTreeWalkerStub = sinon.stub(document, 'createTreeWalker');
        createTreeWalkerStub.returns(mockTreeWalker);
        nextHitStub = sinon.stub(hits, 'shift');
        nextNodeStub = sinon.stub(mockTreeWalker, 'nextNode');
        parentNodeIsValidStub = sinon.stub(testResultSearch, 'parentNodeIsValid');
      });

      afterEach(() => {
        mockTreeWalker.currentNode = {
          nodeName: null,
          textContent: null
        };

        createResultNodeStub.resetHistory();
        createTreeWalkerStub.resetHistory();
        nextHitStub.resetHistory();
        nextNodeStub.resetHistory();
        parentNodeIsValidStub.resetHistory();

        createResultNodeStub.returns(null);
        nextHitStub.returns(null);
        nextNodeStub.returns(null);
        parentNodeIsValidStub.returns(null);
      });

      after(() => {
        createResultNodeStub.restore();
        createTreeWalkerStub.restore();
        nextHitStub.restore();
        nextNodeStub.restore();
        parentNodeIsValidStub.restore();
      });

      it('should stop when there are no more results', () => {
        nextHitStub.returns(undefined);
        testResultSearch.mapHitsToResultNodes('', hits);
        expect(nextHitStub.calledOnce).to.equal(true);
      });

      it('should stop if the current node is null', () => {
        mockTreeWalker.currentNode = null;
        testResultSearch.mapHitsToResultNodes('', hits);
        expect(nextHitStub.calledOnce).to.equal(true);
      });

      it('should skip non-text nodes', () => {
        nextHitStub.returns('someHit');
        nextNodeStub.returns(null);
        mockTreeWalker.currentNode = {nodeName: 'notText'};
        testResultSearch.mapHitsToResultNodes('', hits);
        expect(nextNodeStub.calledOnce).to.equal(true);
      });

      describe('if the current node does not include a result', () => {

        beforeEach(() => {
          mockTreeWalker.currentNode.nodeName = '#text';
          mockTreeWalker.currentNode.textContent = 'test';

          nextHitStub.onCall(0).returns(offsetHit);
          nextHitStub.onCall(1).returns(undefined);
        });

        it('should progress to the next node', () => {
          nextNodeStub.returns(null);
          testResultSearch.mapHitsToResultNodes('', hits);
          expect(nextNodeStub.calledOnce).to.equal(true);
          expect(createResultNodeStub.notCalled).to.equal(true);
        });

        it('should increase the current text index by the node text length', () => {
          const nextNode = {
            nodeName: '#text',
            textContent: 'LeBron James',
          };
          nextNodeStub.returns(nextNode);
          parentNodeIsValidStub.returns(true);

          testResultSearch.mapHitsToResultNodes('', hits);
          expect(nextNodeStub.calledOnce).to.equal(true);
          expect(createResultNodeStub.calledOnce).to.equal(true);
          expect(createResultNodeStub.withArgs(offsetHit, nextNode, 4).calledOnce).to.equal(true);
        });

      });

      describe('if the current node includes a result', () => {

        beforeEach(() => {
          mockTreeWalker.currentNode = {
            nodeName: '#text',
            textContent: 'LeBron James'
          };

          nextHitStub.onCall(0).returns(hit);
          nextHitStub.onCall(1).returns(undefined);
        });

        it('should check parent node validity', () => {
          parentNodeIsValidStub.returns(false);
          testResultSearch.mapHitsToResultNodes('', hits);
          expect(parentNodeIsValidStub.calledOnce).to.equal(true);
          expect(parentNodeIsValidStub.withArgs(mockTreeWalker.currentNode).calledOnce).to.equal(true);
        });

        it('should get the next result', () => {
          parentNodeIsValidStub.returns(false);
          testResultSearch.mapHitsToResultNodes('', hits);
          expect(nextHitStub.calledTwice).to.equal(true);
        });

        describe('if the parent node is valid', () => {

          it('should highlight the result', () => {
            parentNodeIsValidStub.returns(true);
            testResultSearch.mapHitsToResultNodes('', hits);
            expect(createResultNodeStub.calledOnce).to.equal(true);
            expect(createResultNodeStub.withArgs(hit, mockTreeWalker.currentNode, 0).calledOnce).to.equal(true);
          });

        });

        describe('if the parent node is invalid', () => {

          it('should not highlight the result', () => {
            parentNodeIsValidStub.returns(false);
            testResultSearch.mapHitsToResultNodes('', hits);
            expect(createResultNodeStub.notCalled).to.equal(true);
          });

        });

      });

    });

    describe('parentNodeIsValid', () => {

      it('should return false if parent node is script', () => {
        const currentNode = {
          parentNode: {
            nodeName: 'SCRIPT'
          }
        };
        expect(testResultSearch.parentNodeIsValid(currentNode)).to.equal(false);
      });

      it('should return false if parent node is style', () => {
        const currentNode = {
          parentNode: {
            nodeName: 'STYLE'
          }
        };
        expect(testResultSearch.parentNodeIsValid(currentNode)).to.equal(false);
      });

      it('should return true for other parent node types', () => {
        const currentNode = {
          parrentNode: {
            nodeName: 'SPAN'
          }
        };
        expect(testResultSearch.parentNodeIsValid(currentNode)).to.equal(true);
      });

      it('should return true if current node has no parent', () => {
        const currentNode = {
          parentNode: null
        };
        expect(testResultSearch.parentNodeIsValid(currentNode)).to.equal(true);
      });

    });

    describe('createResultNode', () => {

      let hit;

      before(() => {
        hit = {start: 0, end: 11, text: 'LeBronJames'};
      });

      describe('if hit is not fully contained by passed in node', () => {
        it('should return null', () => {
          expect(testResultSearch.createResultNode(hit, '', 1)).to.equal(null);
        });

      });

      describe('if hit is fully contained by passed in node', () => {

        it('should return passed in node wrapped in new span', () => {
          const parent = document.createElement('div');
          const textNode = document.createTextNode('LeBron James');
          parent.appendChild(textNode);
          const resultNode = testResultSearch.createResultNode(hit, textNode, 0);
          expect(resultNode.outerHTML).to.equal('<span>LeBron James</span>');
        });

      });

    });

  });

  describe('ClickAndRoll', () => {

  });

});

describe('Background Scripts', () => {

  describe('FetchRequestHandler', () => {

    const testFetchRequestHandler = new FetchRequestHandler();

    describe('addListeners', () => {

      let addListenerStub;

      before(() => {
        chrome.runtime.onMessage = {addListener: () => {}};
        addListenerStub = sinon.stub(chrome.runtime.onMessage, 'addListener');
        addListenerStub.returns(null);
      });

      afterEach(() => {
        addListenerStub.resetHistory();
      });

      after(() => {
        addListenerStub.restore();
      });

      it('should call chrome runtime on message add listener twice with correct listeners', () => {
        testFetchRequestHandler.addListeners();
        expect(addListenerStub.calledTwice).to.equal(true);
        expect(addListenerStub.withArgs(testFetchRequestHandler.onFetchPlayers).calledOnce).to.equal(true);
        expect(addListenerStub.withArgs(testFetchRequestHandler.onFetchStats).calledOnce).to.equal(true);
      });

    });

    describe('onFetchPlayers', () => {

      let fetchPlayersStub;
      let formatPlayersStub;
      let sendResponseSpy;

      before(() => {
        fetchPlayersStub = sinon.stub(testFetchRequestHandler, 'fetchPlayers');
        formatPlayersStub = sinon.stub(testFetchRequestHandler, 'formatPlayers');

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

      it('should return true, to indicate that response should be sent asynchronously', () => {
        expect(testFetchRequestHandler.onFetchPlayers('', null, null)).to.equal(true);
      });

      describe('if request message is fetchPlayers', () => {

        it('should call fetchPlayers', () => {
          return testFetchRequestHandler.onFetchPlayers({message: 'fetchPlayers'}, null, sendResponseSpy)
            .then(() => {
              expect(fetchPlayersStub.calledOnce).to.equal(true);
            });
        });

        describe('if fetchPlayers resolves', () => {

          it('should pass fetchPlayers response to formatPlayers', () => {
            fetchPlayersStub.resolves('response');
            return testFetchRequestHandler.onFetchPlayers({message: 'fetchPlayers'}, null, sendResponseSpy)
              .then(() => {
                expect(formatPlayersStub.calledOnce).to.equal(true);
                expect(formatPlayersStub.withArgs('response').calledOnce).to.equal(true);
              });
          });

          it('should send the response', () => {
            fetchPlayersStub.resolves('response');
            formatPlayersStub.returns('players');
            return testFetchRequestHandler.onFetchPlayers({message: 'fetchPlayers'}, null, sendResponseSpy)
              .then(() => {
                expect(sendResponseSpy.calledOnce).to.equal(true);
                expect(sendResponseSpy.withArgs([null, 'players']).calledOnce).to.equal(true);
              });
          });

        });

        describe('if fetchPlayers rejects', () => {

          it('should send the err', () => {
            fetchPlayersStub.rejects('err');
            return testFetchRequestHandler.onFetchPlayers({message: 'fetchPlayers'}, null, sendResponseSpy)
              .catch(() => {
                expect(sendResponseSpy.calledOnce).to.equal(true);
                expect(sendResponseSpy.withArgs(['err', null]).calledOnce).to.equal(true);
              });
          });

        });

      });

      describe('if request message is not fetchPlayers', () => {

        it('should not call any methods', () => {
          testFetchRequestHandler.onFetchPlayers({message: 'wrongMessage'}, null, null);
          expect(fetchPlayersStub.notCalled).to.equal(true);
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
        return testFetchRequestHandler.fetchPlayers()
          .then(() => {
            expect(ajaxStub.withArgs(
              'https://stats.nba.com/stats/commonallplayers',
              {
                method: 'GET',
                data: {
                  LeagueID: '00',
                  Season: '2018-19',
                  IsOnlyCurrentSeason: '0'
                }
              }
            ).calledOnce).to.equal(true);
          });
      });

    });

    describe('onFetchStats', () => {

      let fetchCareerStatsStub;
      let fetchCommonPlayerInfoStub;
      let formatCareerStatsStub;
      let formatPlayerProfileStub;
      let sendResponseSpy;

      before(() => {
        fetchCareerStatsStub = sinon.stub(testFetchRequestHandler, 'fetchCareerStats');
        fetchCommonPlayerInfoStub = sinon.stub(testFetchRequestHandler, 'fetchCommonPlayerInfo');
        formatCareerStatsStub = sinon.stub(testFetchRequestHandler, 'formatCareerStats');
        formatPlayerProfileStub = sinon.stub(testFetchRequestHandler, 'formatPlayerProfile');

        sendResponseSpy = sinon.spy();

        fetchCareerStatsStub.resolves(null);
        fetchCommonPlayerInfoStub.resolves(null);
        formatCareerStatsStub.returns(null);
        formatPlayerProfileStub.returns(null);
      });

      afterEach(() => {
        fetchCareerStatsStub.resetHistory();
        fetchCommonPlayerInfoStub.resetHistory();
        formatCareerStatsStub.resetHistory();
        formatPlayerProfileStub.resetHistory();

        sendResponseSpy.resetHistory();

        fetchCareerStatsStub.resolves(null);
        fetchCommonPlayerInfoStub.resolves(null);
        formatCareerStatsStub.returns(null);
        formatPlayerProfileStub.returns(null);
      });

      after(() => {
        fetchCareerStatsStub.restore();
        fetchCommonPlayerInfoStub.restore();
        formatCareerStatsStub.restore();
        formatPlayerProfileStub.restore();
      });


      it('should return true, to indicate that response should be sent asynchronously', () => {
        expect(testFetchRequestHandler.onFetchStats({message: ''}, null, sendResponseSpy)).to.equal(true);
      });

      describe('if request message is fetchStats', () => {

        it('should call fetchCareerStats with request playerId', () => {
          return testFetchRequestHandler.onFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
            .then(() => {
              expect(fetchCareerStatsStub.calledOnce).to.equal(true);
              expect(fetchCareerStatsStub.withArgs(1).calledOnce).to.equal(true);
            })
        });

        describe('if fetchCareerStats resolves', () => {

          it('should call formatCareerStats with fetchCareerStats response', () => {
            fetchCareerStatsStub.resolves('careerStats');
            return testFetchRequestHandler.onFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
              .then(() => {
                expect(formatCareerStatsStub.calledOnce).to.equal(true);
                expect(formatCareerStatsStub.withArgs('careerStats').calledOnce).to.equal(true);
              })
          });

          it('should call fetchCommonPlayerInfo with request playerId', () => {
            return testFetchRequestHandler.onFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
              .then(() => {
                expect(fetchCommonPlayerInfoStub.calledOnce).to.equal(true);
                expect(fetchCommonPlayerInfoStub.withArgs(1).calledOnce).to.equal(true);
              })
          });

          describe('if fetchCommonPlayerInfo resolves', () => {

            it('should call formatPlayerProfile with fetchCommonPlayerInfo response', () => {
              fetchCommonPlayerInfoStub.resolves('commonPlayerInfo');
              return testFetchRequestHandler.onFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
                .then(() => {
                  expect(formatPlayerProfileStub.calledOnce).to.equal(true);
                  expect(formatPlayerProfileStub.withArgs('commonPlayerInfo').calledOnce).to.equal(true);
                })
            });

            it('should send the response', () => {
              formatCareerStatsStub.returns('careerStats');
              formatPlayerProfileStub.returns('profileStats');
              return testFetchRequestHandler.onFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
                .then(() => {
                  expect(sendResponseSpy.calledOnce).to.equal(true);
                  expect(sendResponseSpy.withArgs([null, {
                    id: 1,
                    career: 'careerStats',
                    profile: 'profileStats'
                  }]).calledOnce).to.equal(true);
                })
            });

          });

          describe('if fetchCommonPlayerInfo rejects', () => {

            it('should send the err', () => {
              fetchCommonPlayerInfoStub.rejects('err');
              return testFetchRequestHandler.onFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
                .catch(() => {
                  expect(sendResponseSpy.calledOnce).to.equal(true);
                  expect(sendResponseSpy.withArgs(['err', null]).calledOnce).to.equal(true);
                })
            });

          })

        });

        describe('if fetchCareerStats rejects', () => {

          it('should send the err', () => {
            fetchCareerStatsStub.rejects('err');
            return testFetchRequestHandler.onFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
              .catch(() => {
                expect(sendResponseSpy.calledOnce).to.equal(true);
                expect(sendResponseSpy.withArgs(['err', null]).calledOnce).to.equal(true);
              })
          });

        });

      });

      describe('if request message is not fetchStats', () => {

        it('should not call any methods', () => {
          testFetchRequestHandler.onFetchStats({message: 'wrongMessage'}, null, sendResponseSpy);
          expect(fetchCareerStatsStub.notCalled).to.equal(true);
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
        return testFetchRequestHandler.fetchCareerStats(1)
          .then(() => {
            expect(ajaxStub.withArgs(
            'https://stats.nba.com/stats/playercareerstats',
              {
                method: 'GET',
                data: {
                  LeagueID: '00',
                  PerMode: 'PerGame',
                  PlayerID: 1
                }
              }
            ).calledOnce).to.equal(true);
          });
      });

    });

    describe('formatCareerStats', () => {

      const response = {
        resultSets: [
          {name: 'SeasonTotalsRegularSeason'},
          {name: 'CareerTotalsRegularSeason'},
          {name: 'SeasonTotalsAllStarSeason',
            headers: [
              'SEASON_ID'
            ],
            rowSet: [
              ['2000'],
              ['2001']
            ]
          },
          {name: 'Other'},
        ]
      };

      it('should return correctly formatted results', () => {
        const expected = {
          seasons: {name: 'SeasonTotalsRegularSeason'},
          career: {name: 'CareerTotalsRegularSeason'},
          allStarSeasons: ['2000', '2001']
        };
        expect(testFetchRequestHandler.formatCareerStats(response)).to.deep.equal(expected);
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
        return testFetchRequestHandler.fetchCommonPlayerInfo(1)
          .then(() => {
            expect(ajaxStub.withArgs(
              'https://stats.nba.com/stats/commonplayerinfo',
              {
                method: 'GET',
                data: {
                  LeagueID: '00',
                  PlayerID: 1
                }
              }
            ).calledOnce).to.equal(true);
          });
      });

    });

    describe('formatPlayerProfile', () => {

      const response = {
        resultSets: [
          {
            headers: [
              'DRAFT_YEAR',
              'DRAFT_ROUND',
              'DRAFT_NUMBER',
              'BIRTHDATE',
              'WEIGHT',
              'TEAM_NAME',
              'TEAM_CITY',
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
              'teamName',
              'teamCity',
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
      let formatTeamStub;
      let getPlayerImageUrlStub;

      before(() => {
        formatDraftStub = sinon.stub(testFetchRequestHandler, 'formatDraft');
        formatBirthdayStub = sinon.stub(testFetchRequestHandler, 'formatBirthday');
        formatWeightStub = sinon.stub(testFetchRequestHandler, 'formatWeight');
        formatTeamStub = sinon.stub(testFetchRequestHandler, 'formatTeam');
        getPlayerImageUrlStub = sinon.stub(testFetchRequestHandler, 'getPlayerImageUrl');

        formatDraftStub.returns('formattedDraft');
        formatBirthdayStub.returns('formattedBirthday');
        formatWeightStub.returns('formattedWeight');
        formatTeamStub.returns('formattedTeam');
        getPlayerImageUrlStub.returns('imageUrl');
      });

      afterEach(() => {
        formatDraftStub.resetHistory();
        formatBirthdayStub.resetHistory();
        formatWeightStub.resetHistory();
        formatTeamStub.resetHistory();
        getPlayerImageUrlStub.resetHistory();
      });

      after(() => {
        formatDraftStub.restore();
        formatBirthdayStub.restore();
        formatWeightStub.restore();
        formatTeamStub.restore();
        getPlayerImageUrlStub.restore();
      });

      it('should return correctly formatted player info', () => {
        const expected = {
          draft: 'formattedDraft',
          birthday: 'formattedBirthday',
          weight: 'formattedWeight',
          team: 'formattedTeam',
          number: 'jersey',
          position: 'position',
          height: 'height',
          country: 'country',
          college: 'school',
          imageUrl: 'imageUrl'
        };
        expect(testFetchRequestHandler.formatPlayerProfile(response)).to.deep.equal(expected);
      });

      it('should call formatting functions with correct values', () => {
        testFetchRequestHandler.formatPlayerProfile(response);
        expect(formatDraftStub.calledOnce).to.equal(true);
        expect(formatDraftStub.withArgs('draftYear', 'draftRound', 'draftNumber').calledOnce).to.equal(true);
        expect(formatBirthdayStub.calledOnce).to.equal(true);
        expect(formatBirthdayStub.withArgs('birthDate').calledOnce).to.equal(true);
        expect(formatWeightStub.calledOnce).to.equal(true);
        expect(formatWeightStub.withArgs('weight').calledOnce).to.equal(true);
        expect(formatTeamStub.calledOnce).to.equal(true);
        expect(formatTeamStub.withArgs('teamName', 'teamCity').calledOnce).to.equal(true);
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
                'TEAM_NAME',
                'TEAM_CITY',
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
                  'teamName',
                  'teamCity',
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
        const expected = {
          draft: 'formattedDraft',
          birthday: 'formattedBirthday',
          weight: 'formattedWeight',
          team: 'formattedTeam',
          number: 'n/a',
          position: 'n/a',
          height: 'n/a',
          country: 'n/a',
          college: 'n/a',
          imageUrl: 'imageUrl'
        };
        expect(testFetchRequestHandler.formatPlayerProfile(responseWithNullValues)).to.deep.equal(expected);
      })

    });

    describe('formatDraft', () => {

      describe('if draftYear is available', () => {

        it('should return formatted draft info', () => {
          expect(testFetchRequestHandler.formatDraft('2000', '1', '1')).to.equal(
            '2000, Round 1, Pick 1'
          );
        });

        describe('if player went undrafted', () => {

          it('should return undrafted', () => {
            expect(testFetchRequestHandler.formatDraft('Undrafted')).to.equal('Undrafted');
          });

        })

      });

      describe('if draftYear is unavailable', () => {

        it('should return \'n/a\'', () => {
          expect(testFetchRequestHandler.formatDraft(null)).to.equal('n/a');
        });

      });

    });

    describe('format Birthday', () => {

      describe('if birthday is available', () => {

        it('should return formatted birthday', () => {
          expect(testFetchRequestHandler.formatBirthday('2000-01-01T00:00:00')).to.equal('2000-01-01');
        });

      });

      describe('if birthday is unavailable', () => {

        it('should return \'n/a\'', () => {
          expect(testFetchRequestHandler.formatBirthday(null)).to.equal('n/a');
        });

      });

    });

  });

});
