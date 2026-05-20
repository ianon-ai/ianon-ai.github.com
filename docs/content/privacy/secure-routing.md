# Secure Routing

A key feature of the ianon frontend is built-in IP and location metadata anonymization.

You do not need to install a VPN or any additional software to use this feature. It also does not require any recurring or paid subscription.

Instead, secure routing in ianon is made possible through its partnership with Anyone Protocol.

## Onion Routing Powered by Anyone

ianon identity protection is stronger than that provided by a VPN.

ianon uses the Anyone Network, a global, free-to-use decentralised onion routing network.

As an incubated project of Anyone, ianon has exclusive access to the Anyone SDK, which allows the app to connect directly to the network and route AI requests through it.

### Onion Routing Explained

Onion routing sends traffic through multiple relays before it reaches the final destination.

Instead of your request going directly from your device to an AI provider, it is routed through a circuit of relays. Each relay only knows the part of the route it needs to handle, making it harder to connect the original user to the final request.

A simplified route looks like this:

```text
User → Entry relay → Middle relay → Exit relay → AI provider
```

This helps anonymize IP and location metadata before the request reaches the provider.

<img class="SecureRouting" src="images/SecureRouting/Onion_Routing.png" alt="Onion routing diagram">

### Latency and Reliability

Onion routing adds extra hops, so it can create some additional latency compared with a direct connection.

However, this largely does not affect the user experience.

Anyone is one of the fastest onion routing networks available, and is considerably faster than competitors like Tor according to like-for-like speed tests.

In addition, the Anyone client can spin up many circuits. If one circuit becomes unavailable, the app can switch to another circuit instead of relying on a single route.

This helps keep requests moving even when individual relays change, fail, or become slow, making reliability very high.

## Routing Settings in the ianon App

You can see and change the status of the main onion routing circuit from the right panel of the ianon app.

The routing panel shows whether the app is connected, the current anonymous IP, the circuit ID, circuit type, and the last circuit rotation.

It also shows the last path used by a request:

```text
Client → Entry → Middle → Exit → Provider
```

This makes the routing layer visible instead of hidden. Users can see which relay path their request used before it reached the selected AI provider.

Users can also rotate the circuit manually from the same panel. This refreshes the active route and gives the app a new path through the Anyone Network.

The panel also includes exit node controls. By default, ianon can use any available exit node. Users can also add a country code or relay fingerprint to guide which exit nodes should be used.

The same panel also shows session request and error counts, helping users see whether requests are routing successfully.

This gives users routing control directly inside ianon, without needing to install a separate VPN or configure an external network tool.

<img class="SecureRouting" src="images/SecureRouting/Routing_Panel.gif" alt="ianon routing panel walkthrough">

## Identity Separation

The Anyone SDK can also enable more sophisticated identity separation.

On startup, the SDK can configure the creation of a large number of circuits. Stream handler logic can then tunnel different requests through different exit IPs.

A future update will maximise this feature to separate identity between different model providers.

This means different providers could see different IP addresses, locations, and device types, helping prevent a single consistent identity from forming across providers.

This is being explored alongside API key rotation ideas currently being iterated on.

<img class="SecureRouting" src="images/SecureRouting/Identity_Separation.png" alt="Identity separation diagram">

