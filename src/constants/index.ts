export const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const JWT_SECRET = process.env.JWT_SECRET || "secret";

let db_url = "mongodb://admin:admin@localhost:27017";

if (process.env.NODE_ENV === "production") {
  const db_name = process.env.DB_NAME;
  const db_pass = process.env.DB_PASS;

  db_url = `mongodb+srv://admin:${db_pass}@cluster0.9f9wl.mongodb.net/${db_name}?retryWrites=true&w=majority`;
}

export const MONGODB_URL = db_url;
