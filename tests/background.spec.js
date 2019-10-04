describe('Background Scripts', () => {

  describe('MessageHandler', () => {

    const messageHandler = new MessageHandler();

    describe('addListener', () => {

      let chromeAddListenerStub;

      before(() => {
        chrome.runtime.onMessage = {addListener: () => {}};
        chromeAddListenerStub = sinon.stub(chrome.runtime.onMessage, 'addListener');
        chromeAddListenerStub.returns(null);
      });

      afterEach(() => {
        chromeAddListenerStub.resetHistory();
      });

      after(() => {
        chromeAddListenerStub.restore();
      });

      it('should call chrome runtime on message add listener with correct listener', () => {
        messageHandler.addListener();
        expect(chromeAddListenerStub.calledOnce).to.equal(true);
        expect(chromeAddListenerStub.withArgs(messageHandler.handleMessage).calledOnce).to.equal(true);
      });

    });

    describe('handleMessage', () => {

      let handleFetchPlayersStub;
      let handleFetchStatsStub;

      before(() => {
        handleFetchPlayersStub = sinon.stub(messageHandler, 'handleFetchPlayers');
        handleFetchStatsStub = sinon.stub(messageHandler, 'handleFetchStats');

        handleFetchPlayersStub.resolves(null);
        handleFetchStatsStub.resolves(null);
      });

      afterEach(() => {
        handleFetchPlayersStub.resetHistory();
        handleFetchStatsStub.resetHistory();
      });

      after(() => {
        handleFetchPlayersStub.restore();
        handleFetchStatsStub.restore();
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
        return messageHandler.handleFetchPlayers({message: 'fetchPlayers'}, null, sendResponseSpy)
          .then(() => {
            expect(fetchPlayersStub.calledOnce).to.equal(true);
          });
      });

      describe('if fetchPlayers resolves', () => {

        it('should pass fetchPlayers response to formatPlayers', () => {
          fetchPlayersStub.resolves('response');
          return messageHandler.handleFetchPlayers({message: 'fetchPlayers'}, null, sendResponseSpy)
            .then(() => {
              expect(formatPlayersStub.calledOnce).to.equal(true);
              expect(formatPlayersStub.withArgs('response').calledOnce).to.equal(true);
            });
        });

        it('should send the response', () => {
          fetchPlayersStub.resolves('response');
          formatPlayersStub.returns('players');
          return messageHandler.handleFetchPlayers({message: 'fetchPlayers'}, null, sendResponseSpy)
            .then(() => {
              expect(sendResponseSpy.calledOnce).to.equal(true);
              expect(sendResponseSpy.withArgs([null, 'players']).calledOnce).to.equal(true);
            });
        });

      });

      describe('if fetchPlayers rejects', () => {

        it('should send the err', () => {
          fetchPlayersStub.rejects('err');
          return messageHandler.handleFetchPlayers({message: 'fetchPlayers'}, null, sendResponseSpy)
            .catch(() => {
              expect(sendResponseSpy.calledOnce).to.equal(true);
              expect(sendResponseSpy.withArgs(['err', null]).calledOnce).to.equal(true);
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
                }
              }
            ).calledOnce).to.equal(true);
          });
      });

    });

    describe('handleFetchStats', () => {

      let fetchCareerStatsStub;
      let fetchCommonPlayerInfoStub;
      let formatCareerStatsStub;
      let formatPlayerProfileStub;
      let sendResponseSpy;

      before(() => {
        fetchCareerStatsStub = sinon.stub(messageHandler, 'fetchCareerStats');
        fetchCommonPlayerInfoStub = sinon.stub(messageHandler, 'fetchCommonPlayerInfo');
        formatCareerStatsStub = sinon.stub(messageHandler, 'formatCareerStats');
        formatPlayerProfileStub = sinon.stub(messageHandler, 'formatPlayerProfile');

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

      it('should call fetchCareerStats with request playerId', () => {
        return messageHandler.handleFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
          .then(() => {
            expect(fetchCareerStatsStub.calledOnce).to.equal(true);
            expect(fetchCareerStatsStub.withArgs(1).calledOnce).to.equal(true);
          })
      });

      describe('if fetchCareerStats resolves', () => {

        it('should call formatCareerStats with fetchCareerStats response', () => {
          fetchCareerStatsStub.resolves('careerStats');
          return messageHandler.handleFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
            .then(() => {
              expect(formatCareerStatsStub.calledOnce).to.equal(true);
              expect(formatCareerStatsStub.withArgs('careerStats').calledOnce).to.equal(true);
            })
        });

        it('should call fetchCommonPlayerInfo with request playerId', () => {
          return messageHandler.handleFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
            .then(() => {
              expect(fetchCommonPlayerInfoStub.calledOnce).to.equal(true);
              expect(fetchCommonPlayerInfoStub.withArgs(1).calledOnce).to.equal(true);
            })
        });

        describe('if fetchCommonPlayerInfo resolves', () => {

          it('should call formatPlayerProfile with fetchCommonPlayerInfo response', () => {
            fetchCommonPlayerInfoStub.resolves('commonPlayerInfo');
            return messageHandler.handleFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
              .then(() => {
                expect(formatPlayerProfileStub.calledOnce).to.equal(true);
                expect(formatPlayerProfileStub.withArgs('commonPlayerInfo').calledOnce).to.equal(true);
              })
          });

          it('should send the response', () => {
            formatCareerStatsStub.returns('careerStats');
            formatPlayerProfileStub.returns('profileStats');
            return messageHandler.handleFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
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
            return messageHandler.handleFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
              .catch(() => {
                expect(sendResponseSpy.calledOnce).to.equal(true);
                expect(sendResponseSpy.withArgs(['err', null]).calledOnce).to.equal(true);
              })
          });

        });

      });

      describe('if fetchCareerStats rejects', () => {

        it('should send the err', () => {
          fetchCareerStatsStub.rejects('err');
          return messageHandler.handleFetchStats({message: 'fetchStats', playerId: 1}, null, sendResponseSpy)
            .catch(() => {
              expect(sendResponseSpy.calledOnce).to.equal(true);
              expect(sendResponseSpy.withArgs(['err', null]).calledOnce).to.equal(true);
            })
        });

      });

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
        expect(messageHandler.formatCareerStats(response)).to.deep.equal(expected);
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
        formatDraftStub = sinon.stub(messageHandler, 'formatDraft');
        formatBirthdayStub = sinon.stub(messageHandler, 'formatBirthday');
        formatWeightStub = sinon.stub(messageHandler, 'formatWeight');
        formatTeamStub = sinon.stub(messageHandler, 'formatTeam');
        getPlayerImageUrlStub = sinon.stub(messageHandler, 'getPlayerImageUrl');

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
        expect(messageHandler.formatPlayerProfile(response)).to.deep.equal(expected);
      });

      it('should call formatting functions with correct values', () => {
        messageHandler.formatPlayerProfile(response);
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
        expect(messageHandler.formatPlayerProfile(responseWithNullValues)).to.deep.equal(expected);
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

    describe('formatTeam', () => {

      describe('if team name and city are available', () => {

        it('should return formatted team', () => {
          expect(messageHandler.formatTeam('Londons', 'London')).to.equal('London Londons');
        });

      });

      describe('if team name or city is unavailable', () => {

        it('should return \'n/a\'', () => {
          expect(messageHandler.formatTeam(null)).to.equal('n/a');
          expect(messageHandler.formatTeam('test', null)).to.equal('n/a');
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