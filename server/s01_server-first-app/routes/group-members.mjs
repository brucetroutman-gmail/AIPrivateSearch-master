// group-members.mjs - API endpoint for AIPS group members
import express from 'express';

const router = express.Router();

// AIPS group member emails
const aipsMembers = [
  'robin.mattern@gmail.com',
  'bruce.troutman@gmail.com', 
  'richard.schinner@gmail.com',
  'alan.mcconnell@gmail.com',
  'ken.fussell@gmail.com',
  'ladi.goc@gmail.com',
  'joe.benin@gmail.com'
];

// Get AIPS group members from iodd.com API
router.get('/group-members', async (req, res) => {
  try {
    const members = [];
    
    for (const email of aipsMembers) {
      try {
        const response = await fetch(`https://iodd.com/api2/member-resume?email=${email}`);
        if (response.ok) {
          const memberData = await response.json();
          members.push(memberData);
        }
      } catch (error) {
        console.log(`Failed to fetch ${email}:`, error.message);
      }
    }
    
    res.json({ success: true, members });
    
  } catch (error) {
    console.error('API error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;