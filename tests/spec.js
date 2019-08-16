
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

    let body;
    let searchStrings;
    let testResultSearch;

    before(() => {
      body = document.createElement('body');
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
          {start: 0, end: 11, name: 'LeBron James'},
          {start: 13, end: 26, name: 'Michael Jordan'}
        ];
        expect(testResultSearch.searchText(text)).to.deep.equal(expectedResult);
      });

    });

    describe('locateAndFormatResults', () => {

      let createTreeWalkerStub;
      let nextResultStub;
      let mockTreeWalker = {
        currentNode: {
          nodeName: null,
        },
        nextNode: null
      };

      before(() => {
        createTreeWalkerStub = sinon.stub(document, 'createTreeWalker');
        createTreeWalkerStub.returns(mockTreeWalker);
        nextResultStub = sinon.stub(testClickAndRoll, 'getNextHit');
      });

      beforeEach(() => {
        nextResultStub.returns('someResult');
      });

      afterEach(() => {
        createTreeWalkerStub.resetHistory();
        nextResultStub.resetHistory();
      });

      after(() => {
        createTreeWalkerStub.restore();
        nextResultStub.restore();
      });

      it('should stop when there are no more results', () => {
        nextResultStub.returns(null);
        testClickAndRoll.locateAndFormatResults(body, []);
        expect(nextResultStub.calledOnce).to.equal(true);
        expect(nextResultStub.withArgs([]).calledOnce).to.equal(true);
      });

      it('should stop if the current node is null', () => {
        testClickAndRoll.locateAndFormatResults(null, []);
        expect(nextResultStub.calledOnce).to.equal(true);
        expect(nextResultStub.withArgs([]).calledOnce).to.equal(true);
      });

      it('should skip non-text nodes', () => {
        mockTreeWalker.currentNode.nodeName = 'notText';
        mockTreeWalker.nextNode = () => null;
        const nextNodeSpy = sinon.spy(mockTreeWalker, 'nextNode');

        testClickAndRoll.locateAndFormatResults(body, []);
        expect(nextNodeSpy.calledOnce).to.equal(true);

        mockTreeWalker.currentNode.nodeName = null;
        mockTreeWalker.nextNode = null;
        nextNodeSpy.restore();
      });

      describe('if the current node does not include a result', () => {

        let nextNodeSpy;

        before(() => {
          mockTreeWalker.nextNode = () => null;
          mockTreeWalker.currentNode.nodeName = '#text';
          nextNodeSpy = sinon.spy(mockTreeWalker, 'nextNode');
          nextResultStub.onCall(0).returns({index: 11, name: 'LeBron James'});
        });

        afterEach(() => {
          nextNodeSpy.resetHistory();
        });

        after(() => {
          mockTreeWalker.nextNode = null;
          mockTreeWalker.currentNode.nodeName = null;
          mockTreeWalker.currentNode.textContent = null;
          nextNodeSpy.restore();
        });

        it('should progress to the next node', () => {
          body.innerHTML = 'test';
          testClickAndRoll.locateAndFormatResults(body, []);
          expect(nextNodeSpy.calledOnce).to.equal(true);
        });

      });

      describe('if the current node includes a result', () => {

        let highlightResultStub;
        let parentNodeIsValidStub;

        before(() => {
          body.innerHTML = 'LeBron James';
          highlightResultStub = sinon.stub(testClickAndRoll, 'highlightResult');
          mockTreeWalker.currentNode.nodeName = '#text';
          mockTreeWalker.currentNode.textContent = 'LeBron James';
          nextResultStub.onCall(0).returns({index: 11, name: 'LeBron James'});
          nextResultStub.onCall(1).returns(null);
          parentNodeIsValidStub = sinon.stub(testClickAndRoll, 'parentNodeIsValid');
        });

        afterEach(() => {
          highlightResultStub.resetHistory();
          parentNodeIsValidStub.resetHistory();
        });

        after(() => {
          highlightResultStub.restore();
          mockTreeWalker.currentNode.nodeName = null;
          mockTreeWalker.currentNode.textContent = null;
          parentNodeIsValidStub.restore();
        });

        it('should check parent node validity', () => {
          parentNodeIsValidStub.returns(false);
          testClickAndRoll.locateAndFormatResults(body, []);
          expect(parentNodeIsValidStub.calledOnce).to.equal(true);
          expect(parentNodeIsValidStub.withArgs(body).calledOnce).to.equal(true);
        });

        it('should get the next result', () => {
          parentNodeIsValidStub.returns(false);
          testClickAndRoll.locateAndFormatResults(body, []);
          expect(nextResultStub.calledTwice).to.equal(true);
        });

        describe('if the parent node is valid', () => {

          it('should highlight the result', () => {
            parentNodeIsValidStub.returns(true);
            testClickAndRoll.locateAndFormatResults(body, []);
            expect(highlightResultStub.calledOnce).to.equal(true);
            expect(highlightResultStub.withArgs({index: 11, name: 'LeBron James'}, body, 0).calledOnce).to.equal(true);
          });

        });

        describe('if the parent node is invalid', () => {

          it('should not highlight the result', () => {
            parentNodeIsValidStub.returns(false);
            testClickAndRoll.locateAndFormatResults(body, []);
            expect(highlightResultStub.notCalled).to.equal(true);
          });

        });

      });

    });

  });

  describe('ClickAndRoll', () => {

  });

});

describe('Background Scripts', () => {

});
