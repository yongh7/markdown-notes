# Probability Theory

Basic concepts in probability theory.

## Sample Space and Events

- **Sample Space** ($\Omega$): The set of all possible outcomes
- **Event** ($A$): A subset of the sample space

## Probability Axioms

For any event $A$:

1. $0 \leq P(A) \leq 1$
2. $P(\Omega) = 1$
3. For mutually exclusive events: $P(A \cup B) = P(A) + P(B)$

## Conditional Probability

The probability of event $A$ given that event $B$ has occurred:

$$P(A|B) = \frac{P(A \cap B)}{P(B)}$$

## Bayes' Theorem

One of the most important theorems in probability:

$$P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$$

## Expected Value

For a discrete random variable $X$:

$$E[X] = \sum_{i} x_i \cdot P(X = x_i)$$

For a continuous random variable:

$$E[X] = \int_{-\infty}^{\infty} x \cdot f(x) \, dx$$
