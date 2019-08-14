
describe('ClickAndRoll', () => {
  let players;
  let testClickAndRoll;
  let testUtils;

  before(() => {
    players = [
      {id: 1, name: 'Michael Jordan'},
      {id: 2, name: 'LeBron James'},
    ];
    testClickAndRoll = new ClickAndRoll(players);
    testUtils = new Utils();
  });

  describe('Set up and start stage', () => {

    describe('checkPlayers', () => {

      let saveToChromeStorageStub;
      let backgroundScriptRequestStub;
      const fetchedPlayers = 'mockFetchedPlayers';
      const cachedPlayers = {players: 'mockCachedPlayers'};

      beforeEach(() => {
        saveToChromeStorageStub = sinon.stub(testUtils, 'saveToChromeStorage');
        backgroundScriptRequestStub = sinon.stub(testUtils, 'backgroundScriptRequest');
        backgroundScriptRequestStub.resolves(fetchedPlayers);
      });

      afterEach(() => {
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

  });

  describe('Find and format matches stage', () => {

    let body;

    before(() => {
      body = document.createElement('body');
      body.innerHTML = '<div>Some Text<div>LeBron James</div><div>Some Text<div>Michael Jordan</div></div></div>'
    });

    it('should locate player names in HTML text content', () => {
      const expectedResult = [
        [20, ['LeBron James']],
        [43, ['Michael Jordan']]
      ];
      expect(testClickAndRoll.searchTextContent(body, ['LeBron James', 'Michael Jordan'])).to.deep.equal(expectedResult);
    });

  });

  describe('Display overlay stage', () => {

  });

});
