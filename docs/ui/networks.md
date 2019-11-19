---
id: networks
title: Networks
sidebar_label: Networks
---

## Network Type Management

Network Types can be viewed and updated by selecting the Networks pull-down
from the top menu, and selecting the Network Types item.

A selection list of existing Network Types is provided.  To edit one, simply
click on the name.  To create a new one, click the "CREATE NETWORK TYPE"
button.

From the **LPWAN Server UI**'s perspective, Network Type is a very simple thing.
It's just a name.  That's it.

But that name is *very* important.  It gets tied to UI customization code.  It
tells us what data to expect for a particular network.  For the most part, even a
system administrator would not be adding a new Network Type without working with
a developer who can make the Network Type name relate to the appropriate software
in the system.  But the ability to add or remove them is provided so irrelevant
(or newly relevant) Network Types can be removed (or added) to the system.

## Network Management

Networks can be viewed and updated by selecting the Networks pull-down
from the top menu, and selecting the Networks item.

A selection list of existing Networks is provided.  To edit one, simply
click on the name.  To create a new one, click the "CREATE NETWORK"
button.

Networks link a Network Type (defining the data needed for the network) and a
Network Protocol (defining how to interact with the remote network server).
In addition, a base URL and version are provided which are passed to the Network Protocol
so the code can know how to interact with the remote network server on the Internet.  Finally, any
Network Type-specific configuration is set.

Note that when a Network Type is selected, only those Network Protocols that
support the Network Type will be enabled for selection.

Base URLs *should* use https, or the network should be implemented to encrypt
data to the remote server so no sensitive data can be easily intercepted.

---
<img src="/img/ui_network.png" alt="Network Form" width="100%" />
