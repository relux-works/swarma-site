// Independent forbidden-surface witnesses; each expected rule comes from the publication contract.
export const plants = [
  ['form', '<form></form>', 'publication-form'],
  ['input', '<input aria-label="Search">', 'publication-input'],
  ['textarea', '<textarea>Details</textarea>', 'publication-textarea'],
  ['select', '<select><option>Details</option></select>', 'publication-select'],
  ['button value', '<button value="">Details</button>', 'publication-button-value'],
  ['iframe', '<iframe title="Details" src="/ru/"></iframe>', 'publication-iframe'],
  ['object', '<object data="/file.pdf"></object>', 'publication-object'],
  ['embed', '<embed src="/file.pdf">', 'publication-embed'],
  ['noscript', '<noscript><p>Details</p></noscript>', 'publication-noscript'],
  ['template', '<template><p>Details</p></template>', 'publication-template'],
  ['event handler', '<a href="/" onClick="return false">Details</a>', 'publication-event-handler'],
  ['JavaScript URL', '<a href=" JaVa&#9;ScRiPt:alert(1)">Details</a>', 'publication-javascript-url'],
  ['document data URL', '<a href="d&#97;ta:text/html,%3Cp%3EDetails%3C/p%3E">Details</a>', 'publication-data-url'],
  ['meta refresh', '<meta HTTP-EQUIV=" Refresh " content="0;url=/ru/">', 'publication-meta-refresh'],
];

export const reviewPlants = [
  ['R5 status button value', '<input type="button" value="Swarma Chain is available now">', 'publication-input'],
  ['R5 encoded name value', '<input type="button" value="Swarm&#32;Runtime">', 'publication-input'],
  ['R5 status placeholder', '<input aria-label="Search" placeholder="Swarma Chain is available now">', 'publication-input'],
  ['R6 srcdoc status', '<iframe title="Details" srcdoc="&lt;p&gt;Swarma Chain available&amp;#32;now&lt;/p&gt;"></iframe>', 'publication-iframe'],
  ['R6 srcdoc name', '<iframe title="Details" srcdoc="&lt;p&gt;Swarm&amp;#32;Runtime&lt;/p&gt;"></iframe>', 'publication-iframe'],
  ['R6 srcdoc email and link', '<iframe title="Details" srcdoc="&lt;a href=&quot;mailto:reader&amp;#64;example.org&quot;&gt;Contact&lt;/a&gt;&lt;a href=&quot;https://github.com/relux-works/&amp;#112;rivate-example&quot;&gt;Source&lt;/a&gt;"></iframe>', 'publication-iframe'],
  ['R6 noscript status', '<noscript><p>Swarma Chain available&#32;now</p></noscript>', 'publication-noscript'],
  ['R6 noscript email', '<noscript><a href="mailto:reader&#64;example.org">Contact</a></noscript>', 'publication-noscript'],
];
