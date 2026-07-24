import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();
const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules);

md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
  const info = tokens[idx].info.trim();
  const match = /^pruvon:(\S+)/.exec(info);
  if (!match) {
    return defaultFence(tokens, idx, options, env, slf);
  }

  const fnName = match[1];
  const tableHtml = md.render(tokens[idx].content).trim();
  return tableHtml.replace('<table>', `<table data-execute="${fnName}">`);
};

export function renderMarkdownSpec(markdownSource) {
  return md.render(markdownSource);
}
