describe('Content script', () => {

  describe('Set up and start stage', () => {

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
      expect(searchTextContent(body, ['LeBron James', 'Michael Jordan'])).to.deep.equal(expectedResult);
    });

  });

  describe('Display overlay stage', () => {

  });

});
