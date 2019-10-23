const utils = new Utils();
const popup = new Popup();

window.addEventListener('load', () => {
  popup.initialiseSettings();
});

window.addEventListener('click',function(e){
  if (e.target.href !== undefined) {
    chrome.tabs.create({ url: e.target.href });
  }

  if (e.target.id === 'extension-toggle') {
    const slider = e.target.nextElementSibling;
    if (slider.classList.contains('slider-initial')) popup.addToggleAnimation(slider);

    popup.toggleCheckbox('extension-toggle');
    utils.getActiveTab()
      .then(tab => {
        popup.toggleSetting('clickAndRoll', (new URL(tab.url)).hostname)
      });
  }

  if (e.target.id === 'domain-toggle') {
    const slider = e.target.nextElementSibling;
    if (slider.classList.contains('slider-initial')) popup.addToggleAnimation(slider);

    popup.toggleCheckbox('domain-toggle');
    utils.getActiveTab()
      .then(tab => {
        const domain = (new URL(tab.url)).hostname;
        popup.toggleSetting(domain, domain);
      });
  }
});
