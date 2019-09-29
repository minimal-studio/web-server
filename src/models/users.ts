import mysql from "mysql";

const query = (sql: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host     : "localhost",
      user     : "root",
      password : "xiangqwejie",
      database : "ttzq"
    });
  
    connection.connect();
  
    connection.query(sql, function (error, results, fields) {
      if (error) throw error;
      console.log("The solution is: ", results[0].solution);
      resolve(results);
    });
  
    connection.end();
  });
};

export const queryUser = (username: string) => {
  return query(`SELECT ${username} AS solution`);
};

export const addUser = () => {
  return query("SELECT 1 + 1 AS solution");
};