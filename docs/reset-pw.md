## 重置 MySQL 的用户密码

- 参考: https://gist.github.com/zubaer-ahammed/c81c9a0e37adc1cb9a6cdc61c4190f52

Shell

```shell
sudo mysqld_safe --skip-grant-tables
mysql -u root
```

sql

```sql
UPDATE mysql.user SET authentication_string=null WHERE User='root';
FLUSH PRIVILEGES;
exit;
```

最后

```sql
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'password';
```
