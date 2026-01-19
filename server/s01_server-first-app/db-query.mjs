// db-query.mjs
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env-aips from /Users/Shared/AIPrivateSearch/
const envPath = '/Users/Shared/AIPrivateSearch/.env-aips';
dotenv.config({ path: envPath, quiet: true, debug: false });
 
async function queryMembers( req, res ) {  // A express route or endpoint handler, e.g. "/getResume?email=bruce.troutman@gmail.com"
  let connection;
 
//var aEmail = req.params.email;           // endpoint argument, email, from req: request object
  var aEmail = "bruce.troutman@gmail.com"
     
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USERNAME || 'aips-readwrite',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'aiprivatesearch'
    });
 
    console.log('Connected to MySQL database');
 
var [ member, projects ] = await getMemberData( connection, aEmail )
 
    console.log(`Found ${projects.length} projects for ${aEmail}:`);
    console.log( JSON.stringify(member, null, 2) );
    console.log( JSON.stringify(projects, null, 2) );
 
var pResult = { }
    pResult.member   = member
    pResult.projects = projects
 
//  res.json( pResult );  // send pResule object back to the client using res: response object
 
//  pResult =
//    { member: {MemberNo: 15, TitleName: 'Mr.', FirstName: 'Bruce', LastName: 'Troutman', Email: 'bruce.troutman@gmail.com', …}
//    , projects [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, ... ]
//      }
 
//    debugger
 
  } catch (error) {
    console.error('Database error:', error.message);
    throw error;
  } finally {
    // Always close connection
    if (connection) {
      await connection.end();
      console.log('Connection closed');
    }
 
   }
} // eof queryMembers
 
// -----------------------------------------------------------------
 
    async function getMemberData( connection, aEmail ) {
    // Execute query
    try {
//  const [rows, fields] = await connection.execute('SELECT * FROM members');
//  const [rows, fields] = await connection.execute('SELECT * FROM members WHERE member_email = "bruce.troutma@gmail.com');
    var aSQL1 = `SELECT MemberNo, TitleName, FirstName, LastName, Email, Company, Address1, Address2,
                City, State, Zip, Country, Phone1, Phone2, WebSite FROM members WHERE Email = "${aEmail}"`
 
    var aSQL2 = `SELECT projects.Name, projects.Client, projects.ClientWeb, projects.ProjectWeb,
                projects.Location, projects.ProjectType, projects.Industry, projects.Description,
                members_projects.Role, members_projects.Duration, members_projects.Dates
                FROM projects, members_projects, members
                WHERE members.Email = "${aEmail}"
                AND members.MemberNo = members_projects.MemberNo
                AND members_projects.ProjectId = projects.Id`;
 
    var [member,   fields] = await connection.execute( aSQL1 );
    var [projects, fields] = await connection.execute( aSQL2 );
 
    return [ member[0], projects ];
 
  } catch (error) {
    console.error('Database error:', error.message);
    throw error;
  }
} // eof getMemberData
 
 
// Run the query
queryMembers()
  .then(members => {
    console.log('\nQuery completed successfully');
  })
  .catch( error => {
    console.error('Script failed:', error);
    process.exit(1);
  });