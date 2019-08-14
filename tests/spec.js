
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

  describe('ClickAndRoll', () => {

    let players;
    let testClickAndRoll;

    before(() => {
      players = [
        {id: 1, name: 'Michael Jordan'},
        {id: 2, name: 'LeBron James'},
      ];
      testClickAndRoll = new ClickAndRoll(players);
    });

    describe('Locating and highlighting matches', () => {

      let body;

      before(() => {
        body = document.createElement('body');
        body.innerHTML = '<div>Some Text<div>LeBron James</div><div>Some Text<div>Michael Jordan</div></div></div>'
      });

      describe('searchTextContent', () => {

        it('should locate player names in HTML text content', () => {
          const expectedResult = [
            [20, ['LeBron James']],
            [43, ['Michael Jordan']]
          ];
          expect(testClickAndRoll.searchTextContent(body, ['LeBron James', 'Michael Jordan'])).to.deep.equal(expectedResult);
        });

      });

    });

    describe('Displaying stat overlay', () => {

    });

  });

});

describe('Background Scripts', () => {

});
