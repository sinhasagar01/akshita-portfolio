# Portable conventions

Rules and limits that came out of this project and are not about this project. Everything here has
been paid for once. None of it is theory.

**The test applied to every entry.** Does the rule survive without its example. If it needs the
example to be intelligible, the example travels with it in one line. If it does not, the example
stays in `CLAUDE.md` and `docs/STATE.md` where it happened, and the rule goes alone.

**Part two is a different kind of thing.** A limit is not a rule waiting for someone to implement it.
It is a fact about what instruments cannot see, and writing it down is the whole remedy. A reader who
cannot tell a rule from a limit will try to build a gate for the limit and will believe the gate.

---

## Part one. Rules

### 1. State the subject beside every number

Not "1.24 fails" but "1.24, on this element, on this ground". A number without its subject is an
invitation to supply one, and the reader who supplies the wrong one will write down a confident
correction.

This is the single highest-yield habit in this document. Eighteen separate defects in one project
shared exactly one shape, which is a measurement whose stated subject was not the one it was taken
against. Every one would have been visible at the moment it was written.

### 2. A rule whose reference is unnamed will be corrected by the next person to check it

A relation stated without naming what it is relative to is not merely incomplete. It is a trap,
because three plausible references will each produce a convincing refutation, and a refutation gets
written down.

*Example, because the rule reads as obvious and is not.* A tint rule recorded as "lightness step
minus two, hue delta zero, chroma step nine to thirteen thousandths" was exact and referenced to
nothing. Checked against the three references a reader reaches for first, all three disagreed. The
real reference was a relation inside the component, and the correction was one keystroke from being
committed.

### 3. Before searching a multi variable space, check whether the objective depends on every variable

A sequence of attempts that each fix one thing and break another reads as a hard trade off. It is
often a variable being moved that the objective does not contain.

Factorise first. Solve over the variables the objective actually depends on, then over the rest. A
search that had failed three times in a row can become a single pass.

### 4. Assert the pair, never either half

When two values must move together, a check on one side passes wherever the two happen to coincide,
and coincidence is the normal case right up until it is not. Assert the relation.

The failure is invisible by construction. Everything looks correct in the environment where the two
agree, which is the environment the author was working in.

### 5. A guard derived from the thing it guards cannot fail when that thing moves

If a guard computes its expectation from its own subject, lowering the subject lowers the guard, and
the guard goes on reporting comfort. Compare against a literal, or against a count arrived at by an
independent route.

This one recurred twice in a single day, the second instance written after the first had been
recorded. Both looked correct. Both passed their own subject. Both were caught by mutation and
neither by reading, which is the argument for mutation testing every new assertion rather than the
ones that look risky.

### 6. A threshold must name what it was measured on

A threshold calibrated on one population and applied to another is a borrowed number that reads as a
measured one. Require the threshold to state its subject, and make that a check rather than a
comment.

Distinguish what your evidence proves from what you want it to prove. Knowing that one value is too
close is a ceiling on the threshold, not the threshold.

### 7. When a row's title states a quantity, the row must compute it

Prose and data written together, by the same hand, in the same moment, are never checked against each
other. A title saying "the six members" beside a list of five will pass for as long as anyone leaves
it alone.

Either compute the quantity from the data, or do not state one in the title.

### 8. A gate's vocabulary is narrower than its concept

Every gate is written against the cases that existed when it was written, and it starts decaying
immediately. When a gate misses something it should have caught, widen the matcher to the concept.
Never bend the subject to fit the matcher.

The stronger form is to **derive the subject rather than enumerate it**. An enumerated subject is
correct on the day it is written. A derived one cannot fall behind its own population.

### 9. Any assertion over generated output must state how many subjects it found

A gate over a built bundle, a rendered page or a derived map passes trivially when its subject is
empty. The output moved, the scan matched nothing, and zero failures reads as success.

State the count and assert a floor against a constant, so a shrunken subject fails rather than agrees.

### 10. Gate the obvious workaround, not only the thing itself

Ask what the cheapest way to satisfy your constraint would be, and whether that way is also measured.
Most constraints can be satisfied by loosening the very thing they measure.

### 11. Establishing that a check does not apply is not establishing that nothing is wrong

A guard that correctly rules itself out closes the file. The reasoning is sound, the conclusion is
narrow, and the record it leaves behind reads exactly like a clean bill of health.

When something is excluded from a check, write down which check and why, and treat the remaining
questions as open rather than as absent. The dangerous exclusions are the correct ones.

### 12. A low alpha overlay drains the hue beneath it rather than adding its own

Composite a colour over a different hue at low alpha and the result is not a blend you can see as two
colours. It is the underlying hue with its chroma pulled down. The further apart the hues, the more
it mutes and the less it clashes.

The consequence is that **a decorative colour tuned against one background desaturates every other
one**, and you will go looking for a clash and find nothing, because the failure mode is muting. A
thing that reads as slightly flat is much harder to notice than a thing that reads as wrong, and it
survives review for that reason.

### 13. A pending decision needs a register the gate reads, not a comment the next reader must notice

When work is blocked on a person's judgement, encode the evidence as data and compute the decision
from it. Then the answer arrives as one row rather than a rewritten paragraph, and a value that the
evidence does not support fails on arrival.

A comment saying "awaiting a decision" is invisible to everything and ages into a fact.

### 14. Ask what varies before building the first instance

The shape of the thing is decided by what will differ between instances, and that question is cheap
before there is one instance and expensive after there are several.

The practical form is to **build the second variant early, even if it is held back**. One instance
cannot reveal an inconsistency between two ways of producing the same result.

### 15. Name the parameter rather than the value

A value hard coded at a call site is a decision nobody made and nobody can find. A named parameter is
a decision with an owner, and the name is where the reasoning goes.

### 16. A rule applies first to the file recording it

Write the rule, then check the document you wrote it in. Prose and data in one file look like one
claim and are two, and only a third thing can tell you they disagree.

### 17. A carried item is a claim about the present

An open list decays exactly like a comment, and nothing fails when it does. An item closed in the code
but never struck stays true looking, keeps its rank, and directs work.

This is rule 16 one level out. A rule applies first to the file recording it, and **a list of open work
is a file recording claims**. Re read the list against the code before ranking anything from it,
because the entry that is wrong is the one nobody has touched, and the ones nobody has touched are
exactly the ones that get carried.

*Example, because the failure mode is that it does not feel like a failure.* An item reading "the five
descriptions are still empty, write them or decide to drop the field" was carried for many sessions and
ranked first for a session's content work. The field had been deleted from the schema, with the
reasoning recorded beside the deletion, and no consumer had ever existed.

### 18. Capture the exit code before any pipe touches it

A pipeline's status is the last command's. A check piped into a formatter gates on the formatter,
which always succeeds. The gate exists, is wired to the wrong subject, and reports success.

This recurred three times in one project. The first two were fixed by intention, which is why they
recurred.

### 19. A wrong unit produces confident, checkable looking claims

It does not produce obvious nonsense. It produces specific numbers and real names, with the true
finding hiding among them.

When a record and an instrument disagree, ask what unit each side counts in before believing either.
And before dismissing a gate's output as instrument error, check the instances one at a time, because
"my probe was coarse" explains away true findings exactly as well as false ones.

### 20. A population can be complete, measured, and still be the wrong noun

A denominator check confirms you counted everything you looked at. It cannot tell you that the thing
you counted is the thing you named.

### 21. Judge the premise and the investigation separately

A check run for a wrong reason can still be the check that was needed. And a conclusion can survive
its evidence being corrected, in which case it should be **seen** to have survived, because a true
conclusion propped up by a reason nobody can reproduce is indistinguishable from luck.

### 22. Treat agreement with a forecast as no evidence at all

A prediction that a number will move makes any movement look like the predicted one. When a predicted
number moves, establish why before accepting it.

This is a defect in the reader rather than in the instrument, so no assertion can catch it.

### 23. A clean sweep is a reason to re read the predicate, not to stop checking

A unanimous result on the wrong quantity reads as overwhelming evidence. Every partial result has at
least one figure that looks odd. A perfect one has none, which is what makes it persuasive.

### 24. Withhold a measurement you do not understand

A wrong diagnosis costs a session. A wrong diagnosis written down as a cause costs however long it
takes the next person to stop believing it.

Six measurements were produced and withheld in one component in a single session, each for a reason
the previous one taught. Every one would have passed review. Four reconciled with their neighbours.
Withholding is the cheaper half of that trade every time, and it does not feel like it in the moment.

### 25. Nothing reported is evidence, including a report you wrote yourself

Every claim about a system should be checked against that system. This is obvious for measurements
and is routinely skipped for statements about tooling, state and process, which are exactly the
claims no instrument is watching.

Prefer a measurement the artefact carries over an assertion made beside it. A capture that verifies
its own subject cannot be mislabelled. A screenshot with a caption can.

### 26. A safety net that restores the wrong state is worse than an absent one

Because it is trusted. An absent net makes people careful. A net that silently hands back the wrong
thing while reporting success does not.

### 27. Zero consumers is a reason to delete, not to exempt forever

An exemption is what lets a dead thing survive review for as long as the exemption list does.

### 28. A refusal registry is worth as much as a decision registry

Record what was considered and rejected, with the reason. Otherwise the same question is asked and
answered repeatedly, and each answer is slightly different.

---

## Part two. Limits

These are not open tasks. They are the boundaries of what the instruments can see. The remedy is to
know them.

### A. Provenance is unverifiable

Every instrument checks values. None checks that a measurement's stated subject is the one it was
taken against. The variants seen in one project were a wrong element, a wrong threshold, a wrong
predicate, a wrong property, a wrong population, a subject supplied by a shell, and a count inflated
by a join.

A gate for this would check that a stated subject matches a declared one, and the defect is always
that the declaration was never written down. Rule 1 is the only thing that has reliably worked.

### B. Paint order is not in the tree

A cascade walk cannot model paint order. An element's visual ground may be a positioned sibling that
no ancestor walk reaches, so "what is this drawn on" is not computable from structure.

The consequence is that any claim of the form "every consumer sits on the ground its name asserts" is
unverifiable in general, not merely unverified.

### C. Only the render knows what meets what

A model of the composited result is not the composited result. Where a question turns on what
something is drawn on, sample the pixel before reasoning about it, not after the reasoning fails.

Two components in one project had grounds that every cheaper method got wrong, including an anatomy
table, a source read, a DOM walk and a cascade walk. The paint was consulted last both times.

The mirror of this is that a static instrument cannot know which pairings actually occur. A ratio
between two things that never appear together is as meaningless as a ratio involving a thing that
cannot exist, and both return plausible numbers.

### D. An instrument that samples one state cannot see a conditional

If an attribute, a class or a style is a function of state, a single sample reports one branch as if
it were the whole. A control correctly hidden while it is invisible and inert will be reported as a
defect, and the report will look exactly like a true one.

Read the source before believing a structural finding from a sweep.

### E. A build does not preserve form

Anything inferred from generated output carries the compiler's normalisation. Classification by form
goes blind one pass deeper every time the pipeline changes, and the fix is recomputation rather than
a better matcher, which only works where the source value can be re derived.

Most things are not re derivable. Name that before relying on the inference.

---

## What this cost

Roughly four hundred pull requests on a single site, with an assertion suite that grew to about two
thousand seven hundred checks across sixty seven files. Most entries above are one defect that
happened between two and eighteen times before anyone named the shape.

The recurring cause, stated once, is that **an instrument's subject is narrower than its claim**. Rules
1, 2, 6, 7, 8, 9, 19 and 20 are all that fact arriving from different directions, and limits A to E
are the places where it cannot be fixed.
