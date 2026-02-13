import mysql from 'mysql2/promise';

let pool:mysql.Pool | null= null;


export function getDBPool(): mysql.Pool{

    if(!pool)
    {
        pool=mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME ,
            connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
      queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),
      waitForConnections: true,
        });
        console.log("MYSQL connection pool created");
    }
    return pool;
}

export async function testDBConnection():Promise<void>{
    const db =   getDBPool();

    const connection =await db.getConnection();

    console.log("Logged in to SQL server");

    connection.release();


}

export async function closeDBPool(): Promise<void>{
    if(pool)
    {
        await pool.end();
        pool=null;
        console.log('MYSQL connection pool closed');
    }
}