~~CREATE DATABASE workhourssync;
ALTER USER postgres WITH PASSWORD 'workhourssync';~~

psql -h localhost -p 5432 -U postgres -d workhourssync
workhourssync

PGPASSWORD=workhourssync psql -h localhost -p 5432 -U postgres -d workhourssync


yarn create next-app@latest workhourssync
