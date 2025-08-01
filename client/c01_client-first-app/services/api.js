const API_ROOT = 'http://localhost:3001';

export async function search(query, score = false) {
  const res = await fetch(`${API_ROOT}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, score })
  });
  
  if (!res.ok) {
    // Get the actual error details
    const errorText = await res.text();
    console.error(`Server returned ${res.status}:`, errorText);
    throw new Error(`Server error: ${res.status} - ${errorText}`);
  }
  
  return res.json();
}
