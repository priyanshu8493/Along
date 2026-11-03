# Along — Problem Statement & Pitch

> **One line:** Two people travelling the same road in separate cabs should be in one
> cab, paying one fair fare — and Along makes that happen automatically.

---

## The 30-second pitch

Every day, people book cabs for journeys that overlap. I travel from A to B; you travel
from C to D, and C to D sits right inside A to B. We each book a cab, we each pay for the
full distance, and two half-empty cars take the same road at the same time.

Along fixes the overlap. You post your trip, we match your actual driving route with
other people travelling the same corridor in the same direction, and we split the fare
by the kilometre — each rider pays for the distance only they travel, plus half of the
shared stretch. Fewer cars, cheaper rides, same road.

---

## The problem

### The scenario

Two people need to get somewhere at roughly the same time.

- **Person A** is going from **A to B**.
- **Person B** is going from **C to D**.
- **C → D lies along A → B.**

Neither knows the other exists. Both open a ride-hailing app. Both book a separate cab.
Both pay for their entire journey alone. Two cars travel the same stretch of road,
side by side, each carrying one person in a vehicle with room for three more.

This is not an edge case. It is the default behaviour of urban travel: the routes
overlap constantly, but the bookings are made in isolation.

### A concrete version

- **Asha** travels **Majestic → Bengaluru Airport**: 34.7 km.
- **Rahul** travels **Hebbal → Bengaluru Airport**: 28.6 km.
- Hebbal sits about 8 km into Asha's route.

They share **26.7 km of the same airport road**, in the same direction, leaving
15 minutes apart. Today they pay **₹546 + ₹460 = ₹1,006** and put two cars on that road.
With Along they pay **₹330 + ₹243 = ₹573** and put one car on it.

The road was never the problem. The **separate booking** was.

### What actually goes wrong

**1. Riders overpay for distance they do not need.**
The person with the shorter trip pays for a full cab even though most of their journey
is already being driven by someone else. The person with the longer trip pays for the
whole corridor even though a second passenger could share most of it. Both lose.

**2. Vehicles run half-empty.**
A typical cab carries **one passenger** while having space for two or three more. Every
occupied seat is a car that does not need to be on the road. Every empty seat is
capacity the city already paid for — in road space, fuel, and time.

**3. The city pays in congestion and emissions.**
More cars than necessary on the same corridor means more traffic, more idling, more
fuel, more emissions, more parking demand, and slower journeys for everyone, including
the people who are not in a cab at all. The cost is not just the fare — it is the
externality.

**4. Existing tools optimise the wrong thing.**
Ride-hailing apps optimise for a single booking. Route planners optimise for one
traveller. Carpool boards optimise for destinations or organisations. Almost nothing
starts from the thing that actually determines whether sharing is possible: **the shape
of the route on the road.**

### Why the obvious alternatives fall short

| Alternative | What it does well | Why the overlap still goes unused |
| --- | --- | --- |
| Solo ride-hail | Fast, convenient, door to door | Full fare per rider; adds a car for every booking |
| Public transport | Cheap, high capacity | Fixed routes and schedules; weak for door-to-door and last-mile |
| Office carpool / shuttle | Good for colleagues on one schedule | Only works inside one organisation, one shift, one destination set |
| Ride-hail "pool" features | Batches some riders | Matches by destination and detour, not by the rider's own route; split is opaque |
| Carpool groups / spreadsheets | Trust and familiarity | Manual coordination, no route matching, no automatic fair split |
| Route-planning apps | Show the best path | Help one person travel; they do not connect two compatible journeys |

None of these makes the overlap **visible, matchable, and fairly priced** in one flow.

### Who feels this most

- **Daily commuters** on dense corridors — the same road, the same hours, every day.
- **Airport and station runs** — long, expensive, and highly overlapping.
- **Students and shift workers** — cost-sensitive, schedule-constrained, often poorly
  served by fixed transit.
- **Two-person friend/colleague trips** — already going the same way, still booking twice.
- **Fleets and cab operators** — more passengers per vehicle-kilometre, better utilisation.
- **Cities** — fewer vehicle trips for the same number of people moved.

### The core insight

> **Shared mobility should be matched on the road, not on the destination.**

Two trips do not need the same origin or the same destination. They need enough of the
same **road, in the same direction, at the same time**. That overlap is the unit of
value — and today it is completely invisible at the moment of booking.

---

## The solution

Along is a route-overlap ride-pooling platform.

1. **Post your trip.** Pickup, drop-off, departure time, and how many people are with you.
2. **We map the real route.** The platform fetches the actual driving route — not a
   straight line between pins.
3. **We find the overlap.** Other open trips are compared against your route. A trip
   matches when it hugs your corridor in the same direction, within the departure
   window, with enough shared distance to be worth sharing.
4. **We show the shared stretch.** Both routes are drawn on a map, with the common
   segment highlighted, so the value is visible before anyone commits.
5. **We split the fare fairly.** You pay for the distance only you travel, plus half
   of the shared stretch. The base fare is split evenly. The two shares always add up
   to the combined ride, and both riders pay less than going solo.

### What makes it different

- **Route-first matching.** The route geometry is the input, not a postcode or a
  destination label. A 26.7 km overlap is found even when the two trips start and end
  in different places.
- **Transparent, distance-based fairness.** The split is explainable in one sentence
  and verifiable on the map. No opaque "pooled price."
- **Same direction by construction.** The engine rejects opposite-direction overlaps,
  so the shared segment is genuinely a shared journey.
- **Works for the trips people actually take.** Commutes, airport runs, station drops,
  inter-neighbourhood travel — not just identical endpoints.
- **Degrades gracefully.** If live routing is unavailable, the product still works with
  an estimate and says so, instead of failing.

### The MVP already proves

- Real road routes for every trip.
- A verified demo match: **93% route overlap, 26.7 km shared, 15-minute departure gap**.
- A fare split that is lower for both riders and sums exactly to the combined ride.
- Pool creation, pool detail, cancellation, and reopening of trips.
- Posting a trip by searching an address or tapping the map.
- A responsive web app with real map rendering.

---

## Value by stakeholder

**Riders**
Cheaper journeys on trips they were already taking. No route compromise when the
overlap is real. A fare that can be checked on a map.

**Drivers and fleets**
More passengers per vehicle-kilometre. Better utilisation without buying more vehicles.
A pooling layer that can sit on top of existing dispatch.

**Cities**
Fewer vehicle trips for the same number of people moved. Less congestion on the
corridors that need it most. Lower emissions per passenger-kilometre.

**Society**
A behaviour change that does not require new roads or new trains — just better use of
the seats and routes that already exist.

---

## Business model directions

Not all of these need to be true for the MVP; they are options to test.

- **Take rate on pooled rides** — a small fee on the shared fare.
- **Commuter subscription** — unlimited or discounted pooling on regular corridors.
- **B2B deployment** — offices, campuses, airports, and hotels pooling their own people.
- **Fleet/operator SaaS** — route-overlap matching and fair-split tooling for existing
  cab companies.
- **Partnerships** — integrate matching into a ride-hailing app rather than compete with it.

The defensible asset is the **matching and fair-split engine** plus the supply of
declared routes — not the map tiles or the cars.

---

## Objections, and how to answer them

**"Won't sharing add a detour?"**
For a nested route, almost none — the shared stretch is already on both routes. For
partial overlaps, the engine only matches routes that hug the same corridor, and the
extra distance is visible in the comparison. The product does not force a detour to
create a pool.

**"Isn't this just ride-hail pooling?"**
No. Ride-hail pooling batches riders around a driver and a destination. Along matches
two riders' own declared routes and splits the fare by the distance each actually
travels. The rider is not being routed through someone else's trip; the overlap is the
reason to share.

**"What about safety and trust?"**
Same-direction verification, identifiable profiles, and contact details are the start.
Real verification, ratings, and in-app coordination are the next layer. The MVP is
honest about this boundary.

**"Will people wait around?"**
The MVP matches within a ±90-minute window and shows the departure gap on every match.
Scheduled commutes and tighter windows are a natural next step.

**"Is this legal / regulated?"**
Start with private ride-sharing and cost-sharing between riders, not commercial taxi
operation. Pooling rules vary by city and country; the model can adapt to local
requirements.

**"Chicken-and-egg: why post if nobody is there?"**
Dense, repeatable corridors (airport runs, office commutes) create liquidity first.
A single posted trip is still useful as a standing request, and the platform can seed
supply corridor by corridor.

---

## Metrics that matter

- **Match rate** — share of posted trips that find at least one viable co-rider.
- **Overlap quality** — median shared distance and route coverage per match.
- **Pool conversion** — matches that turn into confirmed pools.
- **Fare saved** — rupees saved per rider and per pooled trip.
- **Vehicle trips avoided** — the actual congestion benefit.
- **Repeat usage** — whether pooled riders come back on the same corridor.

---

## Roadmap after the MVP

1. **Accept/decline handshake** — the other rider must consent before a pool is confirmed.
2. **In-pool coordination** — chat, pickup notes, live status.
3. **Recurring commutes** — save a route and match it every weekday.
4. **Trust layer** — verification, ratings, gender/safety preferences.
5. **Payments and receipts** — collect the split, not just calculate it.
6. **Fleet integration** — dispatch a pooled ride through an existing cab operator.
7. **Corridor liquidity** — heatmaps of unmet demand to guide supply and partnerships.

---

## Numbers to validate before an investor pitch

The argument above is structural and does not depend on a single statistic. Before
putting numbers on a slide, source and cite:

- The share of urban car trips carrying one occupant.
- Average cost per kilometre for ride-hail in the target city.
- Congestion cost and emissions per vehicle-kilometre.
- The size and frequency of airport/station and commute corridors.
- Local ride-pooling regulations and any cost-sharing rules.

Do not use unsourced percentages in the pitch. Use the structural argument, the live
demo, and one or two verified local numbers.

---

## Closing

Every day, thousands of people travel the same road in separate cabs, each paying for
the whole journey, each occupying a seat that someone else could have shared.

The overlap is already there. Along makes it visible, matchable, and fair.

**Two routes. One cab. A fare that reflects the road you actually shared.**
