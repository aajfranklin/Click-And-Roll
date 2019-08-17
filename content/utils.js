function Utils() {

  this.checkPlayers = (cachedPlayers) => {
    if (!cachedPlayers || $.isEmptyObject(cachedPlayers)) {
      return this.fetchRequest({message: 'fetchPlayers'})
        .then(fetchedPlayers => {
          this.saveToChromeStorage('players', fetchedPlayers);
          return fetchedPlayers;
        })
        .catch(err => {
          console.log(err);
        })
    }

    return Promise.resolve(cachedPlayers.players);
  };

  this.fetchRequest = (request) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(request, (response => {
        const [err, res] = response;
        if (err != null) {
          reject(err);
        } else {
          resolve(res);
        }
      }));
    });
  };

  this.saveToChromeStorage = (name, values) => {
    chrome.storage.local.set({[name]: values}, () => {
      console.log(name + ' saved');
    });
  };

}
