/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");

const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

class HomeSplash extends React.Component {
  render() {
    const { siteConfig, language = "" } = this.props;
    const { baseUrl, docsUrl } = siteConfig;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ""}`;
    const langPart = `${language ? `${language}/` : ""}`;
    const docUrl = (doc) => `${baseUrl}${docsPart}${langPart}${doc}`;

    const SplashContainer = (props) => (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">{props.children}</div>
        </div>
      </div>
    );

    const Logo = (props) => (
      <div className="projectLogo">
        <img src={props.img_src} alt="Project Logo" />
      </div>
    );

    const ProjectTitle = () => (
      <h2 className="projectTitle">
        {siteConfig.title}
        <small>{siteConfig.tagline}</small>
      </h2>
    );

    const PromoSection = (props) => (
      <div className="section promoSection">
        <div className="promoRow">
          <div className="pluginRowBlock">{props.children}</div>
        </div>
      </div>
    );

    const Button = (props) => (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={props.href} target={props.target}>
          {props.children}
        </a>
      </div>
    );

    return (
      <SplashContainer>
        <Logo img_src={`${baseUrl}img/undraw_secure_server.svg`} />
        <div className="inner">
          <ProjectTitle siteConfig={siteConfig} />
          <PromoSection>
            <Button href={docUrl("guides/getting-started")}>Get Started</Button>
            <Button href={siteConfig.repoUrl}>Github</Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

class Index extends React.Component {
  render() {
    const { config: siteConfig, language = "" } = this.props;
    const { baseUrl } = siteConfig;

    const Block = (props) => (
      <Container
        padding={["bottom", "top"]}
        id={props.id}
        background={props.background}
      >
        <GridBlock
          align={props.align || "center"}
          contents={props.children}
          layout={props.layout}
        />
      </Container>
    );

    const FeatureCallout = () => (
      <div
        className="productShowcaseSection paddingBottom"
        style={{ textAlign: "center" }}
      >
        <h2>Feature Callout</h2>
        <MarkdownBlock>These are features of this project</MarkdownBlock>
      </div>
    );

    const TryOut = () => (
      <Block id="try" align="left">
        {[
          {
            content:
              "Application developers can spend less time writing networking code and spend more time on " +
              "core features. Future enhancements may increase the amount of developer time saved by supporting " +
              "common logging and analytics strategies.",
            image: `${baseUrl}img/undraw_user_flow.svg`,
            imageAlign: "left",
            title: "Focus on What Matters",
          },
        ]}
      </Block>
    );

    const Description = () => (
      <Block background="dark" align="left">
        {[
          {
            content:
              "LPWAN Server consists of a server and a web client that enable the management of devices " +
              "within applications. Devices are configured for the types of networks that they support. " +
              "Applications are configured with reporting protocols, so that data can be forwarded from " +
              "devices to the user's IoT application server. Once a device is configured for a type of network, " +
              "the device can be provisioned to any supported network of that type.",
            image: `${baseUrl}img/undraw_features_overview.svg`,
            imageAlign: "right",
            title: "Description",
          },
        ]}
      </Block>
    );

    const LearnHow = () => (
      <Block background="light" align="left">
        {[
          {
            content:
              "There are many solutions available to enable an LPWAN, including LoRaWAN, 3GPP and Sigfox. " +
              "Each solution has it's strengths, and we believe no one LPWAN technology will fully own this IoT space. " +
              "Within each solution there can be many different APIs based on the implementation; however, most LPWAN " +
              "solutions provide a very similar set of functionality. LPWAN Server exists to simplify your IoT application " +
              "and provide isolation from a rapidly evolving landscape by providing a common API and plugins for provisioning " +
              "to various networks.",
            image: `${baseUrl}img/undraw_convert.svg`,
            imageAlign: "right",
            title: "Why LPWAN Server?",
          },
        ]}
      </Block>
    );

    const Features = () => (
      <Block layout="fourColumn">
        {[
          {
            content:
              "Use one API to communicate with devices on different networks",
            image: `${baseUrl}img/undraw_gravitas.svg`,
            imageAlign: "top",
            title: "A Unified LPWAN API",
          },
          {
            content:
              "LPWAN provides you with a dashboard for managing all device types",
            image: `${baseUrl}img/undraw_dashboard.svg`,
            imageAlign: "top",
            title: "Device Management Dashboard",
          },
          {
            content: "Provision devices to networks of your choice",
            image: `${baseUrl}img/undraw_blooming.svg`,
            imageAlign: "top",
            title: "Provisioning",
          },
        ]}
      </Block>
    );

    const Showcase = () => {
      if ((siteConfig.users || []).length === 0) {
        return null;
      }

      const showcase = siteConfig.users
        .filter((user) => user.pinned)
        .map((user) => (
          <a href={user.infoLink} key={user.infoLink}>
            <img src={user.image} alt={user.caption} title={user.caption} />
          </a>
        ));

      const pageUrl = (page) =>
        baseUrl + (language ? `${language}/` : "") + page;

      return (
        <div className="productShowcaseSection paddingBottom">
          <h2>Who is Using This?</h2>
          <p>This project is used by all these people</p>
          <div className="logos">{showcase}</div>
          <div className="more-users">
            <a className="button" href={pageUrl("users.html")}>
              More {siteConfig.title} Users
            </a>
          </div>
        </div>
      );
    };

    const CookieBanner = () => {
      const { baseUrl } = siteConfig;
      return (
        <div id="cookieBanner">
          <p>
            Lpwanserver.com uses cookies to provide you the best experience.
          </p>
          <button id="acknowledge">Got it</button>
        </div>
      );
    };

    return (
      <div>
        <HomeSplash siteConfig={siteConfig} language={language} />
        <div className="mainContainer">
          <Features />
          {/* <FeatureCallout /> */}
          <LearnHow />
          <TryOut />
          <Description />
          {/* <Showcase /> */}
          <CookieBanner />
        </div>
      </div>
    );
  }
}

module.exports = Index;
