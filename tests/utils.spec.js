describe('Utils', () => {

  const testUtils = new Utils();

  describe('checkPlayers', () => {

    let saveToLocalStorageStub;
    let sendRunTimeMessageStub;
    const fetchedPlayers = 'mockFetchedPlayers';
    const cachedPlayers = {players: 'mockCachedPlayers'};

    before(() => {
      saveToLocalStorageStub = sinon.stub(testUtils, 'saveToLocalStorage');
      sendRunTimeMessageStub = sinon.stub(testUtils, 'sendRuntimeMessage');
      sendRunTimeMessageStub.resolves(fetchedPlayers);
    });

    afterEach(() => {
      saveToLocalStorageStub.resetHistory();
      sendRunTimeMessageStub.resetHistory();
    });

    after(() => {
      saveToLocalStorageStub.restore();
      sendRunTimeMessageStub.restore();
    });

    it('should resolve players fetched from storage if they are present', () => {
      return testUtils.checkPlayers(cachedPlayers)
        .then((response) => {
          expect(sendRunTimeMessageStub.notCalled).to.equal(true);
          expect(saveToLocalStorageStub.notCalled).to.equal(true);
          expect(response).to.equal('mockCachedPlayers')
        })
    });

    it('should fetch and store players if they are not in local chrome storage', () => {
      return testUtils.checkPlayers(undefined)
        .then((response) => {
          expect(sendRunTimeMessageStub.withArgs({message: 'fetchPlayers'}).calledOnce).to.equal(true);
          expect(saveToLocalStorageStub.withArgs('players', fetchedPlayers).calledOnce).to.equal(true);
          expect(response).to.equal(fetchedPlayers);
        })
    });

  });

  describe('sendRuntimeMessage', () => {

    let chromeSendMessageStub;
    let request = {message: 'testRequest'};
    let response;

    before(() => {
      response = [null, 'res'];
      chromeSendMessageStub = sinon.stub(chrome.runtime, 'sendMessage');
      chromeSendMessageStub.callsArgWith(1, response);
    });

    afterEach(() => {
      chromeSendMessageStub.resetHistory();
    });

    after(() => {
      chromeSendMessageStub.restore();
    });

    it('should send a message to chrome runtime with passed in request', () => {
      return testUtils.sendRuntimeMessage(request)
        .then(() => {
          expect(chromeSendMessageStub.calledOnce).to.equal(true);
          expect(chromeSendMessageStub.withArgs(request).calledOnce).to.equal(true);
        });
    });

    it('should resolve response if chrome returns no error', () => {
      return testUtils.sendRuntimeMessage(request)
        .then((res) => {
          expect(res).to.equal('res');
        });
    });

    it('should reject if chrome returns an error', () => {
      response = ['err', null];
      chromeSendMessageStub.callsArgWith(1, response);

      return testUtils.sendRuntimeMessage(request)
        .catch((err) => {
          expect(err).to.equal('err');
        })
    });

  });

  describe('getActiveTab', () => {

    before(() => {
      chrome.tabs = {
        query: (input, callback) => callback([{id: 0}])
      }
    });

    after(() => {
      delete chrome.tabs;
    });

    it('should resolve first returned tab', () => {
      return testUtils.getActiveTab()
        .then((tab) => {
          expect(tab).to.deep.equal({id: 0});
        });
    });

  });

  describe('messageActiveTab', () => {

    let sendMessageSpy;

    before(() => {
      chrome.tabs = {
        sendMessage: () => {},
        query: (input, callback) => callback([{id: 0}])
      };

      sendMessageSpy = sinon.spy(chrome.tabs, 'sendMessage');
    });

    afterEach(() => {
      sendMessageSpy.resetHistory();
    });

    after(() => {
      sendMessageSpy.restore();
      delete chrome.tabs;
    });


    it('should send message with id of returned tab and passed in request', () => {
      const request = {message: 'test'};
      testUtils.messageActiveTab(request);
      expect(sendMessageSpy.calledOnce).to.equal(true);
      expect(sendMessageSpy.firstCall.args).to.deep.equal([0, request]);
    });

  });

  describe('saveToLocalStorage', () => {

    let chromeStorageLocalSetSpy;

    before(() => {
      chrome.storage = {
        local: {
          set: (input, callback) => callback()
        }
      };

      chromeStorageLocalSetSpy = sinon.spy(chrome.storage.local, 'set');
    });

    afterEach(() => {
      chromeStorageLocalSetSpy.resetHistory();
    });

    after(() => {
      chromeStorageLocalSetSpy.restore();
      delete chrome.storage;
    });

    it('should call set on chrome local storage with passed in name and values', () => {
      testUtils.saveToLocalStorage('testName', ['testValues']);
      expect(chromeStorageLocalSetSpy.calledOnce).to.equal(true);
      expect(chromeStorageLocalSetSpy.withArgs({['testName']: ['testValues']}).calledOnce).to.equal(true);
    });

  });

  describe('saveToSyncStorage', () => {

    let chromeStorageSyncSpy;

    before(() => {
      chrome.storage = {
        sync: {
          set: (input, callback) => callback()
        }
      };

      chromeStorageSyncSpy = sinon.spy(chrome.storage.sync, 'set');
    });

    afterEach(() => {
      chromeStorageSyncSpy.resetHistory();
    });

    after(() => {
      chromeStorageSyncSpy.restore();
      delete chrome.storage;
    });

    it('should call set on chrome sync storage with passed in name and values', () => {
      return testUtils.saveToSyncStorage('testName', 'testValue')
        .then(() => {
          expect(chromeStorageSyncSpy.calledOnce).to.equal(true);
          expect(chromeStorageSyncSpy.withArgs({testName: 'testValue'}).calledOnce).to.equal(true);
        });
    });

  });

  describe('isSettingOn', () => {

    let result;

    before(() => {
      chrome.storage = {
        sync: {
          get: (input, callback) => callback(result)
        }
      }
    });

    after(() => {
      delete chrome.storage;
    });

    it('should resolve false if chrome storage value is empty string', () => {
      result = {test: ''};

      return testUtils.isSettingOn('test')
        .then((response) => {
          expect(response).to.equal(false);
        });
    });

    it('should resolve true if chrome storage value is \'true\'', () => {
      result = {test: 'true'};

      return testUtils.isSettingOn('test')
        .then((response) => {
          expect(response).to.equal(true);
        });
    });

    it('should resolve true if chrome storage value is empty object', () => {
      result = {};

      return testUtils.isSettingOn('test')
        .then((response) => {
          expect(response).to.equal(true);
        });
    });

  });

  describe('isExtensionOn', () => {
    let isSettingOnStub;

    before(() => {
      isSettingOnStub = sinon.stub(testUtils, 'isSettingOn');
    });

    afterEach(() => {
      isSettingOnStub.resetHistory();
    });

    after(() => {
      isSettingOnStub.restore();
    });

    it('should resolve true if extension is active globally and for the passed in domain', () => {
      isSettingOnStub.resolves(true);
      return testUtils.isExtensionOn('testDomain')
        .then(result => {
          console.log(result);
          expect(result).to.equal(true);
        })
    });

    it('should resolve false if extension is off globally', () => {
      isSettingOnStub.resolves(false);
      return testUtils.isExtensionOn('testDomain')
        .then(result => {
          console.log(result);
          expect(result).to.equal(false);
        })
    });

    it('should resolve false if extension is off for the passed in domain', () => {
      isSettingOnStub.onCall(0).resolves(true);
      isSettingOnStub.onCall(1).resolves(false);
      return testUtils.isExtensionOn('testDomain')
        .then(result => {
          console.log(result);
          expect(result).to.equal(false);
        })
    });

  });

});
