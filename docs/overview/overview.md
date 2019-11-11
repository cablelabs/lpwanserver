---
id: overview
title: LPWAN Server
sidebar_label: Overview
---

## Motivation

LPWANs are designed to cover large geographical areas and
minimize the amount of power required for sensors to interact with the network.
There are many solutions available to enable an LPWAN, including LoRaWAN,
3GPP and Weightless. CableLabs has created a new open source software solution,
the ***LPWAN Server***, to route traffic between LPWAN network technologies and
related solutions.

We believe no one LPWAN technology will fully own this IoT space. Our reasoning
for this belief comes from multiple factors. For example, as we look at the
sensors in this space, some are intended for real-time applications with
consistent and verified uploads, while other sensors simply wake-up
periodically and transmit small data payloads. Without going into more specific
examples, we believe some LPWAN applications are better suited for mobile
networks, while other LPWAN applications are better supported for unlicensed
solutions, such as LoRaWAN.

## Solution

With these considerations in mind, we developed a new open source solution to
enable easily moving data from devices and applications across varying network
types and related solutions. The LPWAN Server was designed to enable multiple
use cases. First, it can be used to simply migrate or operate between two
LoRaWAN network servers, such as ChirpStack and The Things Network.
Second, and more importantly the long-term design intention is to enable the
bridging of multiple LPWAN technologies, such as LoRaWAN and SigFox or LoRaWAN
and NB-IoT. In order to integrate IP-based devices the server enables a “relay
server” of sorts. This allows for the IP traffic to mix with LoRaWAN traffic
for a single upstream interface to an application or data collector, such as
Google Cloud and Microsoft Azure. Our goal with this project is to see
developers integrate more back-end integration with network servers and
technologies to enable this routing of traffic across multiple LPWAN
technologies.

<img
  src="https://cablelabs.github.io/lpwanserver/img/architecture_high_level.png"
  alt="Overview" width="100%"
  style="margin:32px 0"
/>

## Use Cases

The LPWAN Server was designed to support the following use cases:
<UL>
<LI>Multi-vendor LoRaWAN environment
<LI>Multi-network device deployment
<LI>Simplify device provisioning across multiple networks
<LI>Normalize data formats from LPWAN devices
</UL>

Using the LPWAN Server in a multi-vendor LoRaWAN environment allows a network
provider to,
<UL>
<LI>test multiple servers from multiple vendors in a lab,
<LI>trial with multiple network servers from multiple vendors
<LI>run multiple vendor solutions in production
</UL>

The ***LPWAN Server allows you to operate a single application for devices deployed on multiple network types.*** In the future, the LPWAN Server will enable an
IP relay-server for connecting with NB-IoT (and Cat-M1) devices commonly behind
an Evolved Packet Core (EPC). It also allows for managing devices on the
LoRaWAN network. The devices are managed under a single application within the
LPWAN Server. This allows an application to receive data over a single
northbound Application Program Interface (API) rather than maintain API
connections and data flows to multiple networks.

The ***LPWAN Server simplifies provisioning*** to one or more LPWAN networks. A major
challenge for a back-office solution is to integrate provisioning into a new
network server. This is further complicated with multiple new network servers
and types. In order to simplify this, the LPWAN Server manages the APIs to the
networks, and the back-office solution only needs to integrate with a single API
to the LPWAN Server.

The final use case explains how the ***LPWAN Server can normalize data*** from varying
devices on one or more networks. Unfortunately, even in a single network
environment, such as LoRaWAN, there is no standard for data formats from
multiple “like” sensors. For example, a weather sensor from two different
vendors could send the same type of data but change up the order. An application
will need to interpret the data format from multiple sensors. The LPWAN Server
could reformat the data payload into a common format for sending up to the
application server. In this way, the application server will not need to
interpret the data.

## Open Source

The ***LPWAN Server is intended to be a community open source project.*** The initial
release from CableLabs provides support for a multi-vendor LoRaWAN use case.
The back-end, has been designed for future support of all of the use cases, and
the UI is flexible to support them as well. We currently are using the server
for data normalization, too; however, this is via a back-end process. The open
source community is encouraged to take advantage of the initial CableLabs
development and further the development into a useful application for even more
servers, solutions and use cases.
