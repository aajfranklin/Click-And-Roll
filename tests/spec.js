
describe('Content Scripts', () => {

  describe('Utils', () => {

    let testUtils;

    before(() => {
      testUtils = new Utils();
    });

    describe('checkPlayers', () => {

      let saveToChromeStorageStub;
      let backgroundScriptRequestStub;
      const fetchedPlayers = 'mockFetchedPlayers';
      const cachedPlayers = {players: 'mockCachedPlayers'};

      before(() => {
        saveToChromeStorageStub = sinon.stub(testUtils, 'saveToChromeStorage');
        backgroundScriptRequestStub = sinon.stub(testUtils, 'backgroundScriptRequest');
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

    describe('backgroundScriptRequest', () => {

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
        return testUtils.backgroundScriptRequest(request)
          .then(() => {
            expect(sendMessageStub.calledOnce).to.equal(true);
            expect(sendMessageStub.withArgs(request).calledOnce).to.equal(true);
          });
      });

      it('should resolve response if chrome returns no error', () => {
        return testUtils.backgroundScriptRequest(request)
          .then((res) => {
            expect(res).to.equal('res');
          });
      });

      it('should reject if chrome returns an error', () => {
        response = ['err', null];
        sendMessageStub.callsArgWith(1, response);

        return testUtils.backgroundScriptRequest(request)
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

    let searchStrings;
    let testResultSearch;

    before(() => {
      searchStrings = ['LeBron James', 'Michael Jordan'];
      testResultSearch = new ResultSearch();

      testResultSearch.setSearchStrings(searchStrings);
    });

    describe('setSearchStrings', () => {

      it('should set search strings to the passed in value', () => {
        expect(testResultSearch.searchStrings).to.deep.equal(searchStrings);
      });

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

      let createTreeWalkerStub;
      let hits;
      let nextHitStub;
      let mockTreeWalker;

      before(() => {
        mockTreeWalker = {};
        createTreeWalkerStub = sinon.stub(document, 'createTreeWalker');
        createTreeWalkerStub.returns(mockTreeWalker);
        hits = [];
        nextHitStub = sinon.stub(hits, 'shift');
      });

      afterEach(() => {
        createTreeWalkerStub.resetHistory();
        nextHitStub.resetHistory();
      });

      after(() => {
        createTreeWalkerStub.restore();
        nextHitStub.restore();
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
        mockTreeWalker.currentNode = {nodeName: 'notText'} ;
        mockTreeWalker.nextNode = () => null;
        const nextNodeSpy = sinon.spy(mockTreeWalker, 'nextNode');

        testResultSearch.mapHitsToResultNodes('', hits);
        expect(nextNodeSpy.calledOnce).to.equal(true);

        mockTreeWalker.currentNode.nodeName = null;
        mockTreeWalker.nextNode = null;
        nextNodeSpy.restore();
      });

      describe('if the current node does not include a result', () => {

        let createResultNodeStub;
        let hit;
        let nextNodeSpy;

        before(() => {
          mockTreeWalker.currentNode.nodeName = '#text';
          mockTreeWalker.currentNode.textContent = 'test';

          createResultNodeStub = sinon.stub(testResultSearch, 'createResultNode');
          hit = {start: 4, end: 15, text: 'LeBron James'};
          nextHitStub.onCall(0).returns(hit);
          nextHitStub.onCall(1).returns(undefined);
        });

        afterEach(() => {
          createResultNodeStub.resetHistory();
        });

        after(() => {
          mockTreeWalker.nextNode = null;
          mockTreeWalker.currentNode.nodeName = null;
          mockTreeWalker.currentNode.textContent = null;
          createResultNodeStub.restore();
        });

        it('should progress to the next node', () => {
          mockTreeWalker.nextNode = () => null;
          nextNodeSpy = sinon.spy(mockTreeWalker, 'nextNode');

          testResultSearch.mapHitsToResultNodes('', hits);
          expect(nextNodeSpy.calledOnce).to.equal(true);
          expect(createResultNodeStub.notCalled).to.equal(true);

          nextNodeSpy.restore();
        });

        it('should increase the current text index by the node text length', () => {
          const secondNode = {
            nodeName: '#text',
            textContent: 'LeBron James',
          };
          mockTreeWalker.nextNode = () => secondNode;
          nextNodeSpy = sinon.spy(mockTreeWalker, 'nextNode');

          testResultSearch.mapHitsToResultNodes('', hits);
          expect(nextNodeSpy.calledOnce).to.equal(true);
          expect(createResultNodeStub.calledOnce).to.equal(true);
          expect(createResultNodeStub.withArgs(hit, secondNode, 4).calledOnce).to.equal(true);
        });

      });

      describe('if the current node includes a result', () => {

        let createResultNodeStub;
        let hit;
        let parentNodeIsValidStub;

        before(() => {
          createResultNodeStub = sinon.stub(testResultSearch, 'createResultNode');
          hit = {start: 0, end: 11, text: 'LeBron James'};
          mockTreeWalker.currentNode.nodeName = '#text';
          mockTreeWalker.currentNode.textContent = 'LeBron James';
          nextHitStub.onCall(0).returns(hit);
          nextHitStub.onCall(1).returns(undefined);
          parentNodeIsValidStub = sinon.stub(testResultSearch, 'parentNodeIsValid');
        });

        afterEach(() => {
          createResultNodeStub.resetHistory();
          parentNodeIsValidStub.resetHistory();
        });

        after(() => {
          createResultNodeStub.restore();
          mockTreeWalker.currentNode.nodeName = null;
          mockTreeWalker.currentNode.textContent = null;
          parentNodeIsValidStub.restore();
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
          console.log(resultNode);
          expect(resultNode.outerHTML).to.equal('<span>LeBron James</span>');
        });

      });

    });

  });

  describe('ClickAndRoll', () => {

  });

});

describe('Background Scripts', () => {

});
