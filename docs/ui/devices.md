---
id: devices
title: Device Management
sidebar_label: Device Management
---

## Application Management

Applications are used to group devices together that serve essentially the
same purpose.  Data is collected from devices connecting to the various
Networks, and then sent to the Application Vendor using the Reporting
Protocol defined.

When you first log in to the **LPWAN Server UI**, the Home screen is displayed.
This is a "tabbed" screen with the default being the "Applications" tab.  This
tab will show Applications defined for the company.  If you have navigated away
from this screen, click the "Home" breadcrumb to return.

Users who are part of an "Admin" company will see Applications from all
companies.  Applications can be limited by selecting a company name from the
selection list above the list.

Note that the Application list includes whether the Application is running (data
collected from devices will be sent to the application's server).

To get details on an Application, click on its name.  This will show a tabbed
view, with the first tab showing a list of the Devices linked to the
Application.  The second tab, labeled "Application details" will show the
Application's settings: the name, the URL to send data to, the Reporting
Protocol to be used.  Network Types can be added to an application,
and once added, they can be enabled or disabled to control the flow of
device messages.

---
<img src="/img/ui_application.png" alt="Application Form" width="100%" />

## Device Profile Management

A Device Profile is used to define the settings for a given set of devices on a
given Network Type.  The idea is that most Applications will support some number
of Devices that all require the same settings for a given Network Type.  By
using a common Device Profile, configuring new Devices is relatively easy.

The Home screen has a tab for managing Device Profiles.  This
tab also lists all existing Device Profiles.

The fields of a Device Profile are almost entirely defined by the Network Type
that the Device Profile is created for.  The only exception as of this writing
is the name.

Note that a Device Profile is only valid for a single NetworkType.  Therefore,
the selection of the NetworkType is managed through radio buttons rather than
checkboxes.


---
<img src="/img/ui_device_profile.png" alt="Device Profile Form" width="100%" />

## Device Management

Devices are the IoT Devices provided by the Application Vendor that provide the
data used by the Application.

Devices are listed under the Application to which they "belong".  Navigate to
the Applications list, and click on the Application's name to see the Devices
associated with it.

To update a Device, click on its name in the list.  To create a new device,
click the "CREATE DEVICE" button on the listing page.

Devices have a name to identify them in the list, and a Model number (for
reference).  Devices must specify a Device Profile.
Network Types can be added or removed from Devices.  Once added,
a Network Type can be enabled or disabled to control whether or not messages
are passed to/from this device.

---
<img src="/img/ui_device.png" alt="Device Form" width="100%" />
