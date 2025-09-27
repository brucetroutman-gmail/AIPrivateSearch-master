// Test the score calculation directly
const accuracy = 3;
const relevance = 3;
const organization = 2;

const rawScore = (3 * accuracy) + (2 * relevance) + (1 * organization);
const maxScore = 18; // (3×3) + (2×3) + (1×3)
const total = Math.round((rawScore / maxScore) * 100);

console.log(`Scores: A=${accuracy}, R=${relevance}, O=${organization}`);
console.log(`Calculation: (3×${accuracy}) + (2×${relevance}) + (1×${organization}) = ${rawScore}`);
console.log(`Percentage: ${rawScore}/${maxScore} × 100 = ${total}%`);
console.log(`Expected: 94%`);