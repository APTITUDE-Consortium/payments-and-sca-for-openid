(function () {
  'use strict';

  const blocks = document.querySelectorAll(
    'pre code.language-mermaid, pre.language-mermaid > code, code.language-mermaid'
  );
  if (!blocks.length) return;

  blocks.forEach((code) => {
    const pre = code.closest('pre') || code;
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = code.textContent;
    pre.parentNode.replaceChild(div, pre);
  });

  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'base',
      themeVariables: {
        background: '#ffffff',
        primaryColor: '#ffe066',
        primaryTextColor: '#0a1633',
        primaryBorderColor: '#003399',
        lineColor: '#003399',
        secondaryColor: '#e3e7f2',
        tertiaryColor: '#ffffff',
        actorBkg: '#003399',
        actorTextColor: '#ffffff',
        actorLineColor: '#003399',
        signalColor: '#0a1633',
        signalTextColor: '#0a1633',
        labelBoxBkgColor: '#ffcc00',
        labelBoxBorderColor: '#003399',
        labelTextColor: '#0a1633',
        loopTextColor: '#0a1633',
        noteBkgColor: '#fff6c2',
        noteTextColor: '#0a1633',
        noteBorderColor: '#ffcc00',
        activationBkgColor: '#ffcc00',
        activationBorderColor: '#003399',
        sequenceNumberColor: '#003399'
      },
      sequence: {
        diagramMarginX: 24,
        diagramMarginY: 16,
        actorMargin: 60,
        boxMargin: 10,
        boxTextMargin: 6,
        noteMargin: 10,
        messageMargin: 36,
        mirrorActors: false
      }
    });
    await mermaid.run({ querySelector: '.mermaid' });
  `;
  document.head.appendChild(script);
})();
