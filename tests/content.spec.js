describe('Content Scripts', () => {

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

      it('should pass search text hits to filterOverlappingStrings', () => {
        expect(filterOverlappingStringsStub.calledOnce).to.equal(true);
        expect(filterOverlappingStringsStub.withArgs('hits').calledOnce).to.equal(true);
      });

      it('should pass node and filtered hits to mapHitsToResultNodes', () => {
        expect(mapHitsToResultNodesStub.calledOnce).to.equal(true);
        expect(mapHitsToResultNodesStub.withArgs(rootNode, 'filteredHits').calledOnce).to.equal(true);
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

      it('should remove hits that are substrings of other hits', () => {
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
      let isEditableStub;
      let isNestedStringStub;
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
        isEditableStub = sinon.stub(testResultSearch, 'isEditable');
        isNestedStringStub = sinon.stub(testResultSearch,'isNestedString');
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
        isEditableStub.resetHistory();
        isNestedStringStub.resetHistory();
        nextHitStub.resetHistory();
        nextNodeStub.resetHistory();
        parentNodeIsValidStub.resetHistory();

        createResultNodeStub.returns(null);
        isEditableStub.returns(null);
        isNestedStringStub.returns(null);
        nextHitStub.returns(null);
        nextNodeStub.returns(null);
        parentNodeIsValidStub.returns(null);
      });

      after(() => {
        createResultNodeStub.restore();
        createTreeWalkerStub.restore();
        isEditableStub.restore();
        isNestedStringStub.restore();
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

        it('should check if node is editable', () => {
          parentNodeIsValidStub.returns(true);
          isEditableStub.returns(true);
          testResultSearch.mapHitsToResultNodes('', hits);
          expect(isEditableStub.calledOnce).to.equal(true);
          expect(isEditableStub.withArgs(mockTreeWalker.currentNode).calledOnce).to.equal(true);
        });

        it('should check if hit is nested string within node', () => {
          parentNodeIsValidStub.returns(true);
          isEditableStub.returns(false);
          isNestedStringStub.returns(false);
          testResultSearch.mapHitsToResultNodes('', hits);
          expect(isNestedStringStub.calledOnce).to.equal(true);
          expect(isNestedStringStub.firstCall.args).to.deep.equal([hit, mockTreeWalker.currentNode.textContent, 0]);
        });

        it('should get the next result', () => {
          parentNodeIsValidStub.returns(false);
          testResultSearch.mapHitsToResultNodes('', hits);
          expect(nextHitStub.calledTwice).to.equal(true);
        });

        describe('if the parent node is valid, node is not editable, and hit is not nested string', () => {

          it('should highlight the result', () => {
            parentNodeIsValidStub.returns(true);
            isEditableStub.returns(false);
            isNestedStringStub.returns(false);
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

        describe('if the node is editable', () => {

          it('should not highlight the result', () => {
            parentNodeIsValidStub.returns(true);
            isEditableStub.returns(true);
            testResultSearch.mapHitsToResultNodes('', hits);
            expect(createResultNodeStub.notCalled).to.equal(true);
          });

        });

        describe('if the hit is a nested string', () => {

          it('should not highlight the result', () => {
            parentNodeIsValidStub.returns(true);
            isEditableStub.returns(false);
            isNestedStringStub.returns(true);
            testResultSearch.mapHitsToResultNodes('', hits);
            expect(createResultNodeStub.notCalled).to.equal(true);
          });

        });

      });

    });

    describe('parentNodeIsValid', () => {

      let isEditableStub;

      before(() => {
        isEditableStub = sinon.stub(testResultSearch, 'isEditable');
      });

      afterEach(() => {
        isEditableStub.resetHistory();
        isEditableStub.returns(null);
      });

      after(() => {
        isEditableStub.restore();
      });

      it('should return false if parent node is script', () => {
        const currentNode = {
          parentNode: {
            nodeName: 'SCRIPT',
            classList: {
              contains: () => false
            }
          }
        };
        expect(testResultSearch.parentNodeIsValid(currentNode)).to.equal(false);
      });

      it('should return false if parent node is style', () => {
        const currentNode = {
          parentNode: {
            nodeName: 'STYLE',
            classList: {
              contains: () => false
            }
          }
        };
        expect(testResultSearch.parentNodeIsValid(currentNode)).to.equal(false);
      });

      it('should return false if parent node is editable', () => {
        const currentNode = {
          parentNode: {
            nodeName: 'SPAN',
            classList: {
              contains: () => false
            }
          }
        };
        isEditableStub.returns(true);
        expect(testResultSearch.parentNodeIsValid(currentNode)).to.equal(false);
      });

      it('should return false if parent node is a click and roll wrapper', () => {
        const currentNode = {
          parentNode: document.createElement('span')
        };
        currentNode.parentNode.classList.add('click-and-roll-wrapper');
        expect(testResultSearch.parentNodeIsValid(currentNode)).to.equal(false);
      });

      it('should return true for other parent node types without wrapper class', () => {
        const currentNode = {
          parrentNode: {
            nodeName: 'SPAN',
            classList: {
              contains: () => false
            }
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

    describe('isEditable', () => {

      it('should return true if node is an input element', () => {
        const currentNode = document.createElement('input');
        expect(testResultSearch.isEditable(currentNode)).to.equal(true);
      });

      it('should return true if node is content editable', () => {
        const currentNode = document.createElement('div');
        currentNode.contentEditable = "true";
        expect(testResultSearch.isEditable(currentNode)).to.equal(true);
      });

      it('should return false for other node types', () => {
        const currentNode = document.createElement('div');
        expect(testResultSearch.isEditable(currentNode)).to.equal(false);
      });

    });

    describe('isNestedString', () => {

      it('should return true for substrings of longer names', () => {
        const hit = {start: 0, end: 'Mike Bloom'.length - 1, text: 'Mike Bloom'};
        const nodeText = 'Mike Bloomberg';
        const currentTextIndex = 0;

        const result = testResultSearch.isNestedString(hit, nodeText, currentTextIndex);
        expect(result).to.equal(true);
      });

      it('should return true if next char is accented character', () => {
        const hit = {start: 0, end: 'Mike Barr'.length - 1, text: 'Mike Barr'};
        const nodeText = 'Mike Barré';
        const currentTextIndex = 0;

        const result = testResultSearch.isNestedString(hit, nodeText, currentTextIndex);
        expect(result).to.equal(true);
      });

      it('should return false when next char is punctuation or space', () => {
        const hit = {start: 0, end: 'Mike Barr'.length - 1, text: 'Mike Barr'};
        const currentTextIndex = 0;

        let result = testResultSearch.isNestedString(hit, `Mike Barr.`, currentTextIndex);
        expect(result).to.equal(false);
        result = testResultSearch.isNestedString(hit, `Mike Barr,`, currentTextIndex);
        expect(result).to.equal(false);
        result = testResultSearch.isNestedString(hit, `Mike Barr?`, currentTextIndex);
        expect(result).to.equal(false);
        result = testResultSearch.isNestedString(hit, `Mike Barr!`, currentTextIndex);
        expect(result).to.equal(false);
        result = testResultSearch.isNestedString(hit, `Mike Barr:`, currentTextIndex);
        expect(result).to.equal(false);
        result = testResultSearch.isNestedString(hit, `Mike Barr;`, currentTextIndex);
        expect(result).to.equal(false);
        result = testResultSearch.isNestedString(hit, `Mike Barr'`, currentTextIndex);
        expect(result).to.equal(false);
        result = testResultSearch.isNestedString(hit, `Mike Barr"`, currentTextIndex);
        expect(result).to.equal(false);
        result = testResultSearch.isNestedString(hit, `Mike Barr `, currentTextIndex);
        expect(result).to.equal(false);
      });

      it('should return false when there is no next char', () => {
        const hit = {start: 0, end: 'Mike Bloom'.length - 1, text: 'Mike Bloom'};
        const nodeText = 'Mike Bloom';
        const currentTextIndex = 0;

        const result = testResultSearch.isNestedString(hit, nodeText, currentTextIndex);
        expect(result).to.equal(false);
      });

      it('should correctly account for current text index', () => {
        const hit = {start: 4, end: 4 + 'Mike Bloom'.length - 1, text: 'Mike Bloom'};
        const nodeText = 'Mike Bloomberg';
        const currentTextIndex = 4;

        const result = testResultSearch.isNestedString(hit, nodeText, currentTextIndex);
        expect(result).to.equal(true);
      })

    });

    describe('createResultNode', () => {

      let hit;

      before(() => {
        hit = {start: 0, end: 11, text: 'LeBron James'};
      });

      describe('if hit is fully contained by passed in node', () => {

        it('should return passed in node wrapped in new span', () => {
          const parent = document.createElement('div');
          const textNode = document.createTextNode('LeBron James');
          parent.appendChild(textNode);
          const resultNode = testResultSearch.createResultNode(hit, textNode, 0);
          expect(resultNode.outerHTML).to.equal('<span class="click-and-roll-wrapper">LeBron James</span>');
        });

      });

    });

  });

  describe('ClickAndRoll', () => {

    let testClickAndRoll = new ClickAndRoll();

    describe('initialisation', () => {

      it('should create an iframe with id \'click-and-roll-frame\'', ()=> {
        expect(testClickAndRoll.frame.tagName).to.equal('IFRAME');
        expect(testClickAndRoll.frame.id).to.equal('click-and-roll-frame');
      });

      it('should create a div with id \'click-and-roll-frame-container\'', () => {
        expect(testClickAndRoll.frameContainer.tagName).to.equal('DIV');
        expect(testClickAndRoll.frameContainer.id).to.equal('click-and-roll-frame-container');
      });

      it('should create a div with id \'frame-content\'', () => {
        expect(testClickAndRoll.frameContent.tagName).to.equal('DIV');
        expect(testClickAndRoll.frameContent.id).to.equal('frame-content');
      });

    });

    describe('handleMessage', () => {

      let runStub;
      let teardownStub;

      before(() => {
        testClickAndRoll = new ClickAndRoll();
        runStub = sinon.stub(testClickAndRoll, 'run');
        teardownStub = sinon.stub(testClickAndRoll, 'teardown');
      });

      afterEach(() => {
        runStub.resetHistory();
        teardownStub.resetHistory();
      });

      after(() => {
        testClickAndRoll.isRunning = false;
        runStub.restore();
        teardownStub.restore();
      });

      it('should call run if message is start and isRunning is false', () => {
        testClickAndRoll.handleMessage({message: 'start'});
        expect(runStub.calledOnce).to.equal(true);
        expect(teardownStub.notCalled).to.equal(true);
      });

      it('should call teardown if message is stop and isRunning is true', () => {
        testClickAndRoll.isRunning = true;
        testClickAndRoll.handleMessage({message: 'stop'});
        expect(runStub.notCalled).to.equal(true);
        expect(teardownStub.calledOnce).to.equal(true);
      });

      it('should make no calls if message is start and isRunning is true', () => {
        testClickAndRoll.isRunning = true;
        testClickAndRoll.handleMessage({message: 'start'});
        expect(runStub.notCalled).to.equal(true);
        expect(teardownStub.notCalled).to.equal(true);
      });

    });

    describe('run', () => {

      let ajaxStub;
      let getPlayersStub;
      let highlightStub;
      let observeMutationsStub;
      let searchRootNodeStub;
      let setSearchStringsStub;

      before(() => {
        testClickAndRoll = new ClickAndRoll();

        browser.runtime = {
          getURL: () => {}
        };

        ajaxStub = sinon.stub($, 'ajax');
        getPlayersStub = sinon.stub(testClickAndRoll, 'getPlayers');
        highlightStub = sinon.stub(testClickAndRoll, 'highlight');
        observeMutationsStub = sinon.stub(testClickAndRoll, 'observeMutations');
        searchRootNodeStub = sinon.stub(testClickAndRoll.resultSearch, 'searchRootNode');
        setSearchStringsStub = sinon.stub(testClickAndRoll.resultSearch, 'setSearchStrings');

        getPlayersStub.resolves([{NAME: 'name'}]);
        ajaxStub.onFirstCall().resolves('fetchedTemplate');
        ajaxStub.onSecondCall().resolves('fetchedStyle');
        searchRootNodeStub.returns('nodes');
      });

      afterEach(() => {
        ajaxStub.resetHistory();
        getPlayersStub.resetHistory();
        highlightStub.resetHistory();
        observeMutationsStub.resetHistory();
        searchRootNodeStub.resetHistory();
        setSearchStringsStub.resetHistory();
      });

      after(() => {
        ajaxStub.restore();
        getPlayersStub.restore();
        highlightStub.restore();
        observeMutationsStub.restore();
        searchRootNodeStub.restore();
        setSearchStringsStub.restore();
      });

      it('should set running, players, stat template, frame style to correct values', () => {
        return testClickAndRoll.run()
          .then(() => {
            expect(testClickAndRoll.players).to.deep.equal([{NAME: 'name'}].concat(nicknameMap));
            expect(testClickAndRoll.statTemplate).to.equal('fetchedTemplate');
            expect(testClickAndRoll.frameStyle).to.equal('fetchedStyle');
          });
      });

      it('should search the document body for player names', () => {
        return testClickAndRoll.run()
          .then(() => {
            expect(setSearchStringsStub.calledOnce).to.equal(true);
            expect(setSearchStringsStub.firstCall.args[0][0]).to.equal('name');
            expect(searchRootNodeStub.calledOnce).to.equal(true);
            expect(searchRootNodeStub.firstCall.args[0]).to.equal(document.body);
          });
      });

      it('should highlight nodes and observes mutations', () => {
        return testClickAndRoll.run()
          .then(() => {
            expect(highlightStub.calledOnce).to.equal(true);
            expect(highlightStub.firstCall.args[0]).to.equal('nodes');
            expect(observeMutationsStub.calledOnce).to.equal(true);
            expect(observeMutationsStub.firstCall.args.length).to.equal(0);
          });
      });

    });

    describe('getPlayers', () => {

      let getFromLocalStorageStub;
      let sendRuntimeMessageStub;
      let saveToLocalStorageStub;
      let dateNowStub;

      before(() => {
        testClickAndRoll = new ClickAndRoll();

        getFromLocalStorageStub = sinon.stub(testClickAndRoll.utils, 'getFromLocalStorage');
        sendRuntimeMessageStub = sinon.stub(testClickAndRoll.utils, 'sendRuntimeMessage');
        saveToLocalStorageStub = sinon.stub(testClickAndRoll.utils, 'saveToLocalStorage');
        dateNowStub = sinon.stub(Date, 'now').returns(0);

        getFromLocalStorageStub.resolves(null);
      });

      afterEach(() => {
        dateNowStub.returns(0);
        getFromLocalStorageStub.resolves(null);

        getFromLocalStorageStub.resetHistory();
        sendRuntimeMessageStub.resetHistory();
        saveToLocalStorageStub.resetHistory();
      });

      after(() => {
        getFromLocalStorageStub.restore();
        sendRuntimeMessageStub.restore();
        saveToLocalStorageStub.restore();
        dateNowStub.restore();
      });

      it('should resolve players fetched from storage if present and recently updated', () => {
        getFromLocalStorageStub.onFirstCall().resolves(0);
        getFromLocalStorageStub.onSecondCall().resolves(['player']);
        return testClickAndRoll.getPlayers()
          .then((result) => {
            expect(result).to.deep.equal(['player']);
          })
      });

      it('should fetch and resolve players from background script if none stored', () => {
        sendRuntimeMessageStub.resolves(['player']);
        return testClickAndRoll.getPlayers()
          .then((result) => {
            expect(result).to.deep.equal(['player']);
          })
      });

      it('should fetch and resolve players from background script if stored but not recently updated', () => {
        getFromLocalStorageStub.onFirstCall().resolves(-(24 * 60 * 60 * 1000 + 1));
        getFromLocalStorageStub.onSecondCall().resolves(['outDatedPlayers']);
        sendRuntimeMessageStub.resolves(['fetchedPlayers']);
        return testClickAndRoll.getPlayers()
          .then((result) => {
            expect(result).to.deep.equal(['fetchedPlayers']);
          })
      });

    });

    describe('highlight', () => {

      before(() => {
        testClickAndRoll = new ClickAndRoll();
      });

      it('should apply correct styling and onmouseenter method to nodes', () => {
        const nodes = [document.createElement('div'), document.createElement('div')];
        testClickAndRoll.highlight(nodes);
        expect(nodes[0].style.color).to.equal('teal');
        expect(nodes[0].style.display).to.equal('inline');
        expect(nodes[0].onmouseenter).to.equal(testClickAndRoll.handleMouseEnter);
        expect(nodes[0].onmouseleave).to.equal(testClickAndRoll.handleMouseLeave);
        expect(nodes[1].style.color).to.equal('teal');
        expect(nodes[1].style.display).to.equal('inline');
        expect(nodes[1].onmouseenter).to.equal(testClickAndRoll.handleMouseEnter);
        expect(nodes[1].onmouseleave).to.equal(testClickAndRoll.handleMouseLeave);
      });

    });

    describe('observeMutations', () => {

      before(() => {
        testClickAndRoll = new ClickAndRoll();
      });

      afterEach(() => {
        testClickAndRoll.observer.disconnect();
        testClickAndRoll.observer = null;
      });

      it('should create a mutation observer if current observer is null', () => {
        testClickAndRoll.observeMutations();
        expect(testClickAndRoll.observer instanceof MutationObserver).to.equal(true);
      });

      it('should invoke observe with correct args', () => {
        testClickAndRoll.observer = new MutationObserver(() => {});
        const observerStub = sinon.stub(testClickAndRoll.observer, 'observe');
        testClickAndRoll.observeMutations();
        expect(observerStub.calledOnce).to.equal(true);
        expect(observerStub.firstCall.args[0]).to.equal(document.body);
        expect(observerStub.firstCall.args[1]).to.deep.equal({childList: true, subtree: true});
      });

    });

    describe('handleHover', () => {

      let updateActiveNameStub;
      let resetFrameStub;
      let addCloseOverlayListenersStub;
      let getFrameDocumentStub;
      let setFrameLoadingSpy;
      let isFirefoxStub;
      let getStatsStub;

      before(() => {
        testClickAndRoll = new ClickAndRoll();

        testClickAndRoll.activeName = {
          element: {
            textContent: 'testName'
          }
        };

        testClickAndRoll.players = [{NAME: 'testName', PLAYER_ID: '0'}];

        testClickAndRoll.frame = {
          contentWindow: {
            addEventListener: (type, callback) => callback()
          }
        };

        updateActiveNameStub = sinon.stub(testClickAndRoll, 'updateActiveName');
        resetFrameStub = sinon.stub(testClickAndRoll, 'resetFrame');
        addCloseOverlayListenersStub = sinon.stub(testClickAndRoll, 'addCloseOverlayListeners');
        getFrameDocumentStub = sinon.stub(testClickAndRoll, 'getFrameDocument');
        setFrameLoadingSpy = sinon.spy(testClickAndRoll, 'setFrameLoading');
        isFirefoxStub = sinon.stub(testClickAndRoll, 'isFirefox');
        getStatsStub = sinon.stub(testClickAndRoll, 'getStats');
        addEventListenerSpy = sinon.spy(testClickAndRoll.frame.contentWindow, 'addEventListener');

        isFirefoxStub.returns(false);
      });

      afterEach(() => {
        isFirefoxStub.returns(false);

        updateActiveNameStub.resetHistory();
        resetFrameStub.resetHistory();
        addCloseOverlayListenersStub.resetHistory();
        getFrameDocumentStub.resetHistory();
        setFrameLoadingSpy.resetHistory();
        isFirefoxStub.resetHistory();
        getStatsStub.resetHistory();
        addEventListenerSpy.resetHistory();
      });

      after(() => {
        updateActiveNameStub.restore();
        resetFrameStub.restore();
        addCloseOverlayListenersStub.restore();
        getFrameDocumentStub.restore();
        setFrameLoadingSpy.restore();
        isFirefoxStub.restore();
        getStatsStub.restore();
        addEventListenerSpy.restore();
      });

      it('should set current player id to the passed in id', () => {
        testClickAndRoll.handleHover({target: 'test'});
        expect(testClickAndRoll.currentPlayerId).to.equal('0');
      });

      it('should set data received to false', () => {
        testClickAndRoll.handleHover({target: 'test'});
        expect(testClickAndRoll.dataReceived).to.equal(false);
      });

      it('should update active name', () => {
        testClickAndRoll.handleHover({target: 'test'});
        expect(updateActiveNameStub.calledOnce).to.equal(true);
        expect(updateActiveNameStub.firstCall.args[0]).to.equal('test');
      });

      it('should reset frame', () => {
        testClickAndRoll.handleHover({target: 'test'});
        expect(resetFrameStub.calledOnce).to.equal(true);
      });

      it('should directly get stats if browser other than firefox', () => {
        testClickAndRoll.handleHover({target: 'test'});
        expect(addEventListenerSpy.notCalled).to.equal(true);
        expect(getStatsStub.calledOnce).to.equal(true);
        expect(getStatsStub.firstCall.args[0]).to.equal('0');
      });

      it('should add event listener to get stats on iframe load event if browser if firefox', () => {
        isFirefoxStub.returns(true);
        testClickAndRoll.handleHover({target: 'test'});
        expect(addEventListenerSpy.calledOnce).to.equal(true);
        expect(getStatsStub.calledOnce).to.equal(true);
        expect(getStatsStub.firstCall.args[0]).to.equal('0');
      });

    });

    describe('getStats', () => {

      let sendRuntimeMessageStub;
      let displayStatsStub;
      let isSettingOnStub;

      before(() => {
        displayStatsStub = sinon.stub(testClickAndRoll, 'displayStats');
        sendRuntimeMessageStub = sinon.stub(testClickAndRoll.utils, 'sendRuntimeMessage');
        isSettingOnStub = sinon.stub(testClickAndRoll.utils, 'isSettingOn');

        isSettingOnStub.resolves(false);
      });

      afterEach(() => {
        isSettingOnStub.resolves(false);

        sendRuntimeMessageStub.resetHistory();
        displayStatsStub.resetHistory();
        isSettingOnStub.resetHistory();
      });

      after(() => {
        sendRuntimeMessageStub.restore();
        displayStatsStub.restore();
        isSettingOnStub.restore();
      });

      it('get reverse setting value, fetch stats, update player id, and display stats', () => {
        sendRuntimeMessageStub.resolves('stats');
        return testClickAndRoll.getStats('0')
          .then(() => {
            expect(isSettingOnStub.calledOnce).to.equal(true);
            expect(isSettingOnStub.firstCall.args[0]).to.equal('reverse');
            expect(sendRuntimeMessageStub.calledOnce).to.equal(true);
            expect(sendRuntimeMessageStub.firstCall.args[0]).to.deep.equal({message: 'fetchStats', playerId: '0'});
            expect(testClickAndRoll.dataReceived).to.equal(true);
            expect(displayStatsStub.calledOnce).to.equal(true);
            expect(displayStatsStub.firstCall.args).to.deep.equal(['stats', 'testName']);
          });
      });

      it('should set reverse to true if fetched setting is true', () => {
        isSettingOnStub.resolves(true);
        return testClickAndRoll.getStats({target: 'test'})
          .then(() => {
            expect(testClickAndRoll.reverse).to.equal(true);
          });
      });

    });

    describe('updateActiveName', () => {

      before(() => {
        testClickAndRoll = new ClickAndRoll();
      });

      afterEach(() => {
        testClickAndRoll.activeName = {
          element: null,
        }
      });

      it('should apply handleHover to previous active name element if present', () => {
        const target = document.createElement('div');
        target.id = 'target';
        const previous = document.createElement('div');
        previous.id = 'previous';
        testClickAndRoll.activeName.element = previous;
        testClickAndRoll.updateActiveName(target);
        expect(previous.onmouseenter).to.equal(testClickAndRoll.handleMouseEnter);
        expect(previous.onmouseleave).to.equal(testClickAndRoll.handleMouseLeave);
      });

      it('should update active element to new target and remove handleHover', () => {
        const target = document.createElement('div');
        target.id = 'target';
        testClickAndRoll.updateActiveName(target);
        expect(testClickAndRoll.activeName.element).to.equal(target);
        expect(target.onmouseenter).to.equal(null);
      });

    });

    describe('resetFrame', () => {

      let attachFrameStub;
      let applyFrameStylesStub;
      let applyScrollRuleStub;
      let getFrameDocumentStub;
      let positionFrameContainerStub;
      let frameDocumentBodyStub;
      let appendChildStub;
      let isFirefoxStub;
      let addCloseOverlayListenersStub;
      let addTabListenersStub;
      let setFrameLoadingStub;

      before(() => {
        testClickAndRoll = new ClickAndRoll();

        attachFrameStub = sinon.stub(testClickAndRoll, 'attachFrame');
        applyFrameStylesStub = sinon.stub(testClickAndRoll, 'applyFrameStyles');
        applyScrollRuleStub = sinon.stub(testClickAndRoll, 'applyScrollRule');
        getFrameDocumentStub = sinon.stub(testClickAndRoll, 'getFrameDocument');
        positionFrameContainerStub = sinon.stub(testClickAndRoll, 'positionFrameContainer');
        isFirefoxStub = sinon.stub(testClickAndRoll, 'isFirefox');
        addCloseOverlayListenersStub = sinon.stub(testClickAndRoll, 'addCloseOverlayListeners');
        addTabListenersStub = sinon.stub(testClickAndRoll, 'addTabListeners');
        setFrameLoadingStub = sinon.stub(testClickAndRoll, 'setFrameLoading');

        frameDocumentBodyStub = {
          body: {
            appendChild: () => {},
            innerHtml: null
          }
        };

        appendChildStub = sinon.stub(frameDocumentBodyStub.body, 'appendChild');
        getFrameDocumentStub.returns(frameDocumentBodyStub);
        isFirefoxStub.returns(false);
      });

      afterEach(() => {
        isFirefoxStub.returns(false);

        attachFrameStub.resetHistory();
        appendChildStub.resetHistory();
        applyFrameStylesStub.resetHistory();
        applyScrollRuleStub.resetHistory();
        getFrameDocumentStub.resetHistory();
        positionFrameContainerStub.resetHistory();
        isFirefoxStub.resetHistory();
        addCloseOverlayListenersStub.resetHistory();
        addTabListenersStub.resetHistory();
        setFrameLoadingStub.resetHistory();
      });

      after(() => {
        attachFrameStub.restore();
        appendChildStub.restore();
        applyFrameStylesStub.restore();
        applyScrollRuleStub.restore();
        getFrameDocumentStub.restore();
        positionFrameContainerStub.restore();
        isFirefoxStub.restore();
        addCloseOverlayListenersStub.restore();
        addTabListenersStub.restore();
        setFrameLoadingStub.restore();
      });

      it('should attach frame', () => {
        testClickAndRoll.resetFrame();
        expect(attachFrameStub.calledOnce).to.equal(true);
      });

      it('should apply scroll rule', () => {
        testClickAndRoll.resetFrame();
        expect(applyScrollRuleStub.calledOnce).to.equal(true);
      });

      it('should assign apply frame styles', () => {
        testClickAndRoll.frameContainer.parentNode = null;
        testClickAndRoll.resetFrame();
        expect(applyFrameStylesStub.calledOnce).to.equal(true);
      });

      it('should position frame container', () => {
        testClickAndRoll.resetFrame();
        expect(positionFrameContainerStub.calledOnce).to.equal(true);
      });

      it('should append frame content to frame document body', () => {
        testClickAndRoll.resetFrame();
        expect(appendChildStub.calledOnce).to.equal(true);
        expect(appendChildStub.firstCall.args[0]).to.equal(testClickAndRoll.frameContent);
      });

      it('should set frame loading', () => {
        testClickAndRoll.resetFrame();
        expect(setFrameLoadingStub.calledOnce).to.equal(true);
      });

      it('should add close overlay listeners', () => {
        testClickAndRoll.resetFrame();
        expect(addCloseOverlayListenersStub.calledOnce).to.equal(true);
      });

      it('should add tab listeners', () => {
        testClickAndRoll.resetFrame();
        expect(addTabListenersStub.calledOnce).to.equal(true);
      })

    });

    describe('attachFrame', () => {
      let removeChildStub;

      beforeEach(() => {
        removeChildStub = sinon.stub(document.body, 'removeChild');
      });

      afterEach(() => {
        removeChildStub.restore();
        document.body.removeChild(testClickAndRoll.frameContainer);
      });

      it('should remove frame container from body if attached', () => {
        document.body.appendChild(testClickAndRoll.frameContainer);
        testClickAndRoll.attachFrame();
        expect(removeChildStub.calledOnce).to.equal(true);
        expect(removeChildStub.firstCall.args[0]).to.equal(testClickAndRoll.frameContainer);
      });

      it('should append frame container to document body', () => {
        testClickAndRoll.attachFrame();
        expect(testClickAndRoll.frameContainer.parentNode).to.equal(document.body);
      });

      it('should append frame to container', () => {
        testClickAndRoll.attachFrame();
        expect(testClickAndRoll.frame.parentNode).to.equal(testClickAndRoll.frameContainer);
      });

    });

    describe('applyFrameStyles', () => {

      let getFrameDocumentStub;

      before(() => {
        testClickAndRoll = new ClickAndRoll();
        getFrameDocumentStub = sinon.stub(testClickAndRoll, 'getFrameDocument');
        getFrameDocumentStub.returns(document);
      });

      after(() => {
        getFrameDocumentStub.restore();
        document.head.removeChild(document.getElementsByTagName('style')[0]);
      });

      it('should apply appropriate style and id to frame document', () => {
        testClickAndRoll.frameStyle = 'test';
        testClickAndRoll.applyFrameStyles();
        expect(document.getElementsByTagName('style')[0].type).to.equal('text/css');
        expect(document.getElementsByTagName('style')[0].title).to.equal('click-and-roll');
        expect(document.getElementsByTagName('style')[0].textContent).to.equal('test');
      });

    });

    describe('applyScrollRule', () => {

      let setScrollParentStub;

      before(() => {
        setScrollParentStub = sinon.stub(testClickAndRoll, 'setScrollParent');
      });

      afterEach(() => {
        setScrollParentStub.resetHistory();
      });

      after(() => {
        setScrollParentStub.restore();
      });

      it('should not add scroll event listener if scroll parent is body', () => {
        testClickAndRoll.scrollParent = document.body;
        const addEventListenerSpy = sinon.spy(testClickAndRoll.scrollParent, 'addEventListener');
        testClickAndRoll.applyScrollRule();
        expect(addEventListenerSpy.notCalled).to.equal(true);
      });

      it('should add scroll event listener if scroll parent is not body', () => {
        testClickAndRoll.scrollParent = document.createElement('div');
        const addEventListenerSpy = sinon.spy(testClickAndRoll.scrollParent, 'addEventListener');
        testClickAndRoll.applyScrollRule();
        expect(addEventListenerSpy.calledOnce).to.equal(true);
        expect(addEventListenerSpy.firstCall.args).to.deep.equal(['scroll', testClickAndRoll.positionFrameContainer]);
      });

    });

    describe('setScrollParent', () => {

      before(() => {
        testClickAndRoll = new ClickAndRoll();
      });

      it('should return document body if it is the root parent', () => {
        testClickAndRoll.activeName.element = {
          offsetParent: {
            scrollHeight: 1,
            clientHeight: 0,
            offsetParent: document.body
          }
        };

        testClickAndRoll.setScrollParent();
        expect(testClickAndRoll.scrollParent).to.equal(document.body);
      });

      it('should return the scroll parent if document body is not root parent and scroll parent is present', () => {
        const scrollParent = {
          scrollHeight: 1,
          clientHeight: 0,
          offsetParent: {
            scrollHeight: 0,
            clientHeight: 1
          }
        };

        testClickAndRoll.activeName.element = {
          offsetParent: scrollParent
        };

        testClickAndRoll.setScrollParent();
        expect(testClickAndRoll.scrollParent).to.equal(scrollParent);
      });

      it('should return the offset parent if document body is not root parent and scroll parent is null', () => {
        const offsetParent = {
          scrollHeight: 0,
          clientHeight: 1
        };

        testClickAndRoll.activeName.element = {
          offsetParent: {
            scrollHeight: 0,
            clientHeight: 1,
            offsetParent
          }
        };

        testClickAndRoll.setScrollParent();
        expect(testClickAndRoll.scrollParent).to.equal(offsetParent);
      });

    });

    describe('positionFrameContainer', () => {

      let getHalfViewHeightStub;
      let getHalfViewWidthStub;
      let getOffsetFromParentStub;

      before(() => {
        testClickAndRoll = new ClickAndRoll();

        testClickAndRoll.activeName = {
          element: {
            getBoundingClientRect: () => {return {left: 0, top:0}}
          }
        };

        getHalfViewHeightStub = sinon.stub(testClickAndRoll, 'getHalfViewHeight');
        getHalfViewWidthStub = sinon.stub(testClickAndRoll, 'getHalfViewWidth');
        getOffsetFromParentStub = sinon.stub(testClickAndRoll, 'getOffsetFromParent');

        getHalfViewHeightStub.returns(1);
        getHalfViewWidthStub.returns(1);
        getOffsetFromParentStub.returns({top: 50, left: 100})
      });

      afterEach(() => {
        getHalfViewHeightStub.returns(1);
        getHalfViewWidthStub.returns(1);

        getHalfViewHeightStub.resetHistory();
        getHalfViewWidthStub.resetHistory();
        getOffsetFromParentStub.resetHistory();
      });

      after(() => {
        getHalfViewHeightStub.restore();
        getHalfViewWidthStub.restore();
        getOffsetFromParentStub.restore();
      });

      it('should apply 4px left margin if container is in right half', () => {
        getHalfViewWidthStub.returns(-1);
        testClickAndRoll.positionFrameContainer();
        expect(testClickAndRoll.frameContainer.style.marginLeft).to.equal('4px');
      });

      it('should apply 0 left margin if container is in left half', () => {
        getHalfViewWidthStub.returns(1);
        testClickAndRoll.positionFrameContainer();
        expect(testClickAndRoll.frameContainer.style.marginLeft).to.equal('0px');
      });

      it('should not set half if scroll event', () => {
        testClickAndRoll.activeName.isInLeftHalf = null;
        testClickAndRoll.activeName.isInTopHalf = null;
        testClickAndRoll.positionFrameContainer('event');
        expect(testClickAndRoll.activeName.isInLeftHalf).to.equal(null);
        expect(testClickAndRoll.activeName.isInTopHalf).to.equal(null);
      });

      it('should set half if not scroll event', () => {
        testClickAndRoll.activeName.isInLeftHalf = null;
        testClickAndRoll.activeName.isInTopHalf = null;
        testClickAndRoll.positionFrameContainer();
        expect(testClickAndRoll.activeName.isInLeftHalf).to.equal(true);
        expect(testClickAndRoll.activeName.isInTopHalf).to.equal(true);
      });

      it('should set frame container top and left from offset from parent', () => {
        testClickAndRoll.positionFrameContainer();
        expect(testClickAndRoll.frameContainer.style.top).to.equal('50px');
        expect(testClickAndRoll.frameContainer.style.left).to.equal('100px');
      });

      it('should unhide the frame container', () => {
        testClickAndRoll.positionFrameContainer();
        expect(testClickAndRoll.frameContainer.hidden).to.equal(false);
      });

    });

    describe('getOffsetFromParent', () => {
      let rect;

      before(() => {
        testClickAndRoll = new ClickAndRoll();
        rect = {
          left: 10,
          top: 10,
          width: 10,
          height: 10
        };
      });

      describe('if container parent is document body', () => {

        before(() => {
          document.body.appendChild(testClickAndRoll.frameContainer);
        });

        it('should return offset relative to (0,0)', () => {
          testClickAndRoll.activeName.isInLeftHalf = true;
          testClickAndRoll.activeName.isInTopHalf = true;

          const offset = testClickAndRoll.getOffsetFromParent(rect);
          expect(offset.left).to.equal(8);
          expect(offset.top).to.equal(20);
        });

        it('should account for scroll offset', () => {
          testClickAndRoll.activeName.isInLeftHalf = true;
          testClickAndRoll.activeName.isInTopHalf = true;
          window.scrollX = 10;
          window.scrollY = 10;

          const offset = testClickAndRoll.getOffsetFromParent(rect);
          expect(offset.left).to.equal(18);
          expect(offset.top).to.equal(30);

          window.scrollX = 0;
          window.scrollY = 0;
        });

        it('should adjust offset if element is not in top or left half', () => {
          testClickAndRoll.activeName.isInLeftHalf = false;
          testClickAndRoll.activeName.isInTopHalf = false;

          const offset = testClickAndRoll.getOffsetFromParent(rect);
          expect(offset.left).to.equal(18 - window.innerWidth / 2);
          expect(offset.top).to.equal(10 - window.innerHeight / 2);
        });

      });

    });

    describe('applyAnimationClass', () => {

      it('should set frame to reveal from top if in top half', () => {
        testClickAndRoll.activeName.isInTopHalf = true;
        testClickAndRoll.applyAnimationClass();
        expect(testClickAndRoll.frameContent.classList.contains('reveal-from-top')).to.equal(true);
      });

      it('should set frame to reveal from bottom if in bottom half', () => {
        testClickAndRoll.activeName.isInTopHalf = false;
        testClickAndRoll.applyAnimationClass();
        expect(testClickAndRoll.frameContent.classList.contains('reveal-from-bottom')).to.equal(true);
      });

    });

    describe('setFrameLoading', () => {

      before(() => {
        testClickAndRoll = new ClickAndRoll();
        testClickAndRoll.statTemplate = 'testTemplate';
        testClickAndRoll.setFrameLoading('testId');
      });

      it('should set frame content and innerHtml', () => {
        expect(testClickAndRoll.frameContent.classList.length).to.equal(1);
        expect(testClickAndRoll.frameContent.classList.contains('loading')).to.equal(true);
        expect(testClickAndRoll.frameContent.innerHTML).to.equal('testTemplate');
      });

    });

    describe('addCloseOverlayListeners', () => {

      let getFrameDocumentStub;
      let closeOverlayStub;
      let dismiss;

      before(() => {
        testClickAndRoll = new ClickAndRoll();

        getFrameDocumentStub = sinon.stub(testClickAndRoll, 'getFrameDocument');
        closeOverlayStub = sinon.stub(testClickAndRoll, 'closeOverlay');

        getFrameDocumentStub.returns(document);

        dismiss = document.createElement('div');
        dismiss.id = 'dismiss';
        document.body.appendChild(dismiss);
      });

      after(() => {
        document.body.removeChild(dismiss);
        document.removeEventListener('click', testClickAndRoll.closeOverlay);
      });

      it('should add close overlay listener to dismiss button and document', () => {
        testClickAndRoll.addCloseOverlayListeners();
        expect(dismiss.onclick).to.equal(testClickAndRoll.closeOverlay);
      })

    });

    describe('closeOverlay', () => {

      let activeNameElement;
      let dismiss;
      let getFrameDocumentStub;

      before(() => {
        testClickAndRoll = new ClickAndRoll();
        testClickAndRoll.scrollParent = document.createElement('div');

        activeNameElement = document.createElement('div');
        testClickAndRoll.activeName.element = activeNameElement;

        dismiss = document.createElement('div');
        dismiss.id = 'dismiss';
        document.body.appendChild(dismiss);
        dismiss.onclick = () => {};

        getFrameDocumentStub = sinon.stub(testClickAndRoll, 'getFrameDocument');
        getFrameDocumentStub.returns(document);

        testClickAndRoll.closeOverlay();
      });

      after(() => {
        getFrameDocumentStub.restore();
      });

      it('should add handleHover to active name element', () => {
        expect(testClickAndRoll.activeName.element.onmouseenter).to.equal(testClickAndRoll.handleMouseEnter);
        expect(testClickAndRoll.activeName.element.onmouseleave).to.equal(testClickAndRoll.handleMouseLeave);
      });

      it('should hide frame container', () => {
        expect(testClickAndRoll.frameContainer.hidden).to.equal(true);
      });

      it('should remove onclick method from dismiss', () => {
        expect(dismiss.onclick).to.equal(null);
      });

    });

    describe('addTabListeners', () => {

      let getFrameDocumentStub;
      let tab;

      before(() => {
        testClickAndRoll = new ClickAndRoll();

        getFrameDocumentStub = sinon.stub(testClickAndRoll, 'getFrameDocument');
        getFrameDocumentStub.returns(document);

        tab = document.createElement('div');
        tab.classList.add('tab');
        document.body.appendChild(tab);
      });

      after(() => {
        document.body.removeChild(tab);
      });

      it('should add click listeners with updateActiveTab as handler to all tabs', () => {
        testClickAndRoll.addTabListeners();
        expect(tab.onclick).to.equal(testClickAndRoll.updateActiveTab);
      })

    });

    describe('updateActiveTab', () => {
      let getFrameDocumentStub;
      let regularTab;
      let postTab;
      let regularTable;
      let postTable;

      before(() => {
        testClickAndRoll = new ClickAndRoll();

        getFrameDocumentStub = sinon.stub(testClickAndRoll, 'getFrameDocument');
        getFrameDocumentStub.returns(document);

        regularTab = document.createElement('div');
        postTab = document.createElement('div');
        regularTab.classList.add('tab');
        regularTab.id = 'regular';
        postTab.classList.add('tab');
        postTab.id = 'post';
        document.body.appendChild(regularTab);
        document.body.appendChild(postTab);

        regularTable = document.createElement('table');
        regularTable.id = 'regular-season-table';
        postTable = document.createElement('table');
        postTable.id = 'post-season-table';
        document.body.appendChild(regularTable);
        document.body.appendChild(postTable);
      });

      after(() => {
        document.body.removeChild(regularTab);
        document.body.removeChild(postTab);
        document.body.removeChild(regularTable);
        document.body.removeChild(postTable);
      });

      it('should add active class to correct tab and table', () => {
        testClickAndRoll.updateActiveTab({target: postTab});
        expect(postTab.classList.contains('active')).to.equal(true);
        expect(regularTab.classList.contains('active')).to.equal(false);
        expect(postTable.classList.contains('active')).to.equal(true);
        expect(regularTable.classList.contains('active')).to.equal(false);
        testClickAndRoll.updateActiveTab({target: regularTab});
        expect(postTab.classList.contains('active')).to.equal(false);
        expect(regularTab.classList.contains('active')).to.equal(true);
        expect(postTable.classList.contains('active')).to.equal(false);
        expect(regularTable.classList.contains('active')).to.equal(true);
      });

    });

    describe('displayStats', () => {
      let getFrameDocumentStub;
      let checkContentHeightStub;

      let nameElement;

      before(() => {
        testClickAndRoll = new ClickAndRoll();

        getFrameDocumentStub = sinon.stub(testClickAndRoll, 'getFrameDocument');
        checkContentHeightStub = sinon.stub(testClickAndRoll, 'checkContentHeight');

        getFrameDocumentStub.returns(document);

        nameElement = document.createElement('div');
        nameElement.id = 'player-name';
        document.body.appendChild(nameElement);
      });

      afterEach(() => {
        getFrameDocumentStub.resetHistory();
        checkContentHeightStub.resetHistory();
      });

      after(() => {
        getFrameDocumentStub.restore();
        checkContentHeightStub.restore();

        document.body.removeChild(nameElement);
      });

      it('should not call any methods if data has not been received', () => {
        testClickAndRoll.dataReceived = false;
        testClickAndRoll.displayStats();
        expect(getFrameDocumentStub.notCalled).to.equal(true);
        expect(checkContentHeightStub.notCalled).to.equal(true);
      });

      it('should set player name text content, player profile, career stat rows, and check content height if player has career rows', () => {
        let testProfile = document.createElement('div');
        testProfile.id = 'player-profile-content';

        let testRegularTable = document.createElement('table');
        let testPostTable = document.createElement('table');
        testRegularTable.innerHTML = '<tbody id="regular-season-body"></tbody>';
        testPostTable.innerHTML = '<tbody id="post-season-body"></tbody>';

        document.body.appendChild(testProfile);
        document.body.appendChild(testRegularTable);
        document.body.append(testPostTable);

        testClickAndRoll.dataReceived = true;
        testClickAndRoll.displayStats({profileHTML: 'testProfile', regularSeasonHTML: 'testRegular', postSeasonHTML: 'testPost'}, 'testName');
        expect(nameElement.textContent).to.equal('testName');
        expect(testProfile.innerHTML).to.equal('testProfile');
        expect(testRegularTable.innerHTML).to.equal('<tbody id="regular-season-body">testRegular</tbody>');
        expect(testPostTable.innerHTML).to.equal('<tbody id="post-season-body">testPost</tbody>');
        expect(checkContentHeightStub.calledOnce).to.equal(true);

        document.body.removeChild(testProfile);
        document.body.removeChild(testRegularTable);
        document.body.removeChild(testPostTable);
      });

      it('should add empty row if season type has no rows', () => {
        let testProfile = document.createElement('div');
        testProfile.id = 'player-profile-content';
        document.body.appendChild(testProfile);

        let testCareerSection = document.createElement('section');
        testCareerSection.id = 'career-stats';
        testCareerSection.innerHTML = '<table><tbody id="regular-season-body"></tbody></table><table><tbody id="post-season-body"></tbody></table>';
        document.body.appendChild(testCareerSection);

        testClickAndRoll.dataReceived = true;

        testClickAndRoll.displayStats({profileHTML: 'testProfile', regularSeasonHTML: [], postSeasonHTML: []}, 'testName');
        expect(nameElement.textContent).to.equal('testName');
        expect(document.getElementById('regular-season-body').innerHTML).to.equal(config.emptyRowString);
        expect(document.getElementById('post-season-body').innerHTML).to.equal(config.emptyRowString);
        expect(checkContentHeightStub.calledOnce).to.equal(true);

        document.body.removeChild(testProfile);
        document.body.removeChild(testCareerSection);
      });

    });

    describe('reverseCareer', () => {

      it('should reverse the rows of the career table', () => {
        const career = '<tr><td>1</td></tr><tr><td>2</td></tr><tr><td>3</td></tr><tr class="career"><td>4</td></tr>';
        const reversed = '<tr class="career"><td>4</td></tr><tr><td>3</td></tr><tr><td>2</td></tr><tr><td>1</td></tr>';
        expect(testClickAndRoll.reverseCareer(career)).to.equal(reversed);
      })

    });

    describe('checkContentHeight', () => {

      let getFrameDocumentStub;
      let content;

      before(() => {
        getFrameDocumentStub = sinon.stub(testClickAndRoll, 'getFrameDocument');
        getFrameDocumentStub.returns(document);
      });

      beforeEach(() => {
        content = document.createElement('div');
        content.id = 'content';
        document.body.appendChild(content);
      });

      afterEach(() => {
        document.body.removeChild(content);
      });

      it('should add short-career class to frame content if content height is too short', () => {
        testClickAndRoll.checkContentHeight();
        expect(content.classList.contains('short-career')).to.equal(true);
      });

      it('should not add short-career class to frame content if content height is tall enough', () => {
        content.style.height = '100vh';
        testClickAndRoll.checkContentHeight();
        expect(content.classList.contains('short-career')).to.equal(false);
      });

    });

    describe('getHalfViewHeight', () => {

      before(() => {
        testClickAndRoll = new ClickAndRoll();
        window.innerHeight = 100;
      });

      it('should return half the inner height', () => {
        expect(testClickAndRoll.getHalfViewHeight()).to.equal(50);
      })

    });

    describe('getHalfViewWidth', () => {

      before(() => {
        testClickAndRoll = new ClickAndRoll();
        window.innerWidth = 100;
      });

      it('should return half the inner width', () => {
        expect(testClickAndRoll.getHalfViewWidth()).to.equal(50);
      })

    });

    describe('getFrameDocument', () => {

      before(() => {
        testClickAndRoll = new ClickAndRoll();

        document.body.appendChild(testClickAndRoll.frameContainer);
        testClickAndRoll.frameContainer.appendChild(testClickAndRoll.frame);
      });

      after(() => {
        document.body.removeChild(testClickAndRoll.frameContainer);
      });

      it('should return the content document of the iframe', () => {
        expect(testClickAndRoll.getFrameDocument()).to.equal(testClickAndRoll.frame.contentDocument);
      });

    });

    describe('displayNetworkError', () => {
      let getFrameDocumentStub;

      let networkErrorElement;

      before(() => {
        testClickAndRoll = new ClickAndRoll();

        getFrameDocumentStub = sinon.stub(testClickAndRoll, 'getFrameDocument');

        networkErrorElement = document.createElement('div');
        networkErrorElement.id = 'network-error';
        networkErrorElement.hidden = true;
        document.body.appendChild(networkErrorElement);
        getFrameDocumentStub.returns(document);
      });

      afterEach(() => {
        getFrameDocumentStub.resetHistory();
      });

      after(() => {
        getFrameDocumentStub.restore();
        document.body.removeChild(networkErrorElement);
      });

      it('should apply loading and loaded styles to frame content and unhide network error', () => {
        testClickAndRoll.displayNetworkError();
        expect(testClickAndRoll.frameContent.classList.contains('loading')).to.equal(true);
        expect(testClickAndRoll.frameContent.classList.contains('loaded')).to.equal(true);
        expect(networkErrorElement.hidden).to.equal(false);
      });
    });

    describe('teardown', () => {

      let disconnectSpy;

      before(() => {
        testClickAndRoll = new ClickAndRoll();
      });

      beforeEach(() => {
        testClickAndRoll.isRunning = true;
        testClickAndRoll.observer = new MutationObserver(() => {});
        testClickAndRoll.observer.observe(document.body, {childList: true});

        disconnectSpy = sinon.spy(testClickAndRoll.observer, 'disconnect');
      });

      afterEach(() => {
        disconnectSpy.resetHistory();
      });

      after(() => {
        disconnectSpy.restore();
      });

      it('should set isRunning to false', () => {
        testClickAndRoll.teardown();
        expect(testClickAndRoll.isRunning).to.equal(false);
      });

      it('should disconnect observer if not null', () => {
        testClickAndRoll.teardown();
        expect(disconnectSpy.calledOnce).to.equal(true);
      });

      it('should unwrap all result nodes', () => {
        const wrapperParent = document.createElement('div');
        const wrapperHtml = '<span class="click-and-roll-wrapper">Test</span>';
        const wrapper1 = document.createElement('span');
        const wrapper2 = document.createElement('span');
        const wrapper3 = document.createElement('span');
        wrapperParent.appendChild(wrapper1);
        wrapperParent.appendChild(wrapper2);
        wrapperParent.appendChild(wrapper3);
        wrapper1.outerHTML = wrapperHtml;
        wrapper2.outerHTML = wrapperHtml;
        wrapper3.outerHTML = wrapperHtml;
        document.body.appendChild(wrapperParent);

        expect(document.getElementsByClassName('click-and-roll-wrapper').length).to.equal(3);
        testClickAndRoll.teardown();
        expect(document.getElementsByClassName('click-and-roll-wrapper').length).to.equal(0);
        document.body.removeChild(wrapperParent);
      });

    });

  });

});
