/**
 * member-footer.js
 * Get minimal member info for footer display
 */

import mysql from 'mysql2/promise';

async function memberFooterHandler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email parameter is required'
            });
        }

        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const [rows] = await pool.execute(
            'SELECT FirstName, LastName, TitleName, Company FROM members WHERE Email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        const member = rows[0];
        res.json({
            success: true,
            name: `${member.FirstName} ${member.LastName}`,
            title: member.TitleName,
            company: member.Company
        });

    } catch (error) {
        console.error('Member footer error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch member info'
        });
    }
}

export default memberFooterHandler;