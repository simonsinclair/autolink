const $form = document.getElementById('js-add');
const $rules = document.getElementById('js-rules');

const generateId = (length = 8) => {
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < length; i += 1) {
    id += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return id;
};

const getRule = (id, rules) => rules.find(rule => rule.id === id);

const hasRule = (rule, rules) =>
  rules.findIndex(
    currentRule =>
      rule.origin === currentRule.origin && rule.regexp === currentRule.regexp,
  ) !== -1;

const getRules = () =>
  new Promise(resolve =>
    chrome.storage.sync.get(['rules'], ({ rules }) => resolve(rules)),
  );

// Refactor?
// - RulesComponent(state) return html.
// - render(RulesComponent, node)

const render = rules => {
  const html = rules.reduce((accumulatedHtml, rule) => {
    const { id, origin, regexp, target } = rule;
    return `${accumulatedHtml}<li>${origin} &rarr; ${regexp} &rarr; ${target} <button data-id="${id}">Remove &minus;</button></li>`;
  }, '');
  $rules.innerHTML = html;
};

/**
 * Returns Rules after setting a new Rule.
 * @param {Object} rule A Rule object.
 */
const setRule = async rule => {
  const currentRules = await getRules();
  if (hasRule(rule, currentRules)) return currentRules;
  const newRules = [...currentRules, rule];
  await chrome.storage.sync.set(
    {
      rules: newRules,
    },
    () => {
      render(newRules);
    },
  );
  return newRules;
};

const unsetRule = async rule => {
  const currentRules = await getRules();
  if (!hasRule(rule, currentRules)) return currentRules;
  const newRules = currentRules.filter(
    currentRule => currentRule.id !== rule.id,
  );
  await chrome.storage.sync.set(
    {
      rules: newRules,
    },
    () => {
      render(newRules);
    },
  );
  return newRules;
};

const add = async rule =>
  chrome.permissions.request(
    {
      permissions: ['tabs', 'webNavigation'],
      origins: [rule.origin],
    },
    async isGranted => {
      if (isGranted) await setRule(rule);
    },
  );

const remove = async rule => {
  chrome.permissions.remove(
    { origins: [rule.origin], permissions: ['tabs', 'webNavigation'] },
    wasSuccessful => console.log('Perms reset:', wasSuccessful),
  );
  return unsetRule(rule);
};

/** DEV. MODE ON */
chrome.storage.sync.set({
  rules: [
    {
      id: 'rANdom',
      origin: 'https://test-two.com/',
      regexp: 'ISSUETWO-(.*)',
      target: 'https://target.com/ISSUE-{1}',
    },
    {
      id: 'rAnDom',
      origin: 'https://test-one.com/',
      regexp: 'ISSUEONE-(.*)',
      target: 'https://target.com/ISSUE-{1}',
    },
  ],
  misc: ['one', 2],
});
chrome.permissions.getAll(_permissions => {
  console.log('Perms current:', _permissions);
  const { origins } = _permissions;
  chrome.permissions.remove(
    { origins, permissions: ['tabs', 'webNavigation'] },
    wasSuccessful => console.log('Perms reset:', wasSuccessful),
  );
});
/** END DEV. MODE */

const initialise = async () => {
  /**
   * Handle Add Autolink.
   */
  $form.addEventListener('submit', async event => {
    event.preventDefault();

    const rule = { id: generateId() };
    const ruleData = new FormData($form);
    ruleData.forEach((value, key) => {
      rule[key] = value;
    });

    await add(rule);
  });

  /**
   * Handle Remove Autolink.
   */
  $rules.addEventListener('click', async event => {
    const { id } = event.target.dataset;
    const rules = await getRules();
    const rule = getRule(id, rules);
    if (hasRule(rule, rules)) remove(rule);
  });

  /**
   * render Autolink rules.
   */
  render(await getRules());
};

initialise();
