const React = require('react');

function RestApi(props) {
  const {config: siteConfig} = props;
  const {baseUrl} = siteConfig;

  return (
    <iframe id="inlineFrameExample"
      title="Inline Frame Example"
      style={{minHeight:'inherit'}}
      src={`${baseUrl}rest/index.html`}>
    </iframe>
  );
}

module.exports = RestApi;
