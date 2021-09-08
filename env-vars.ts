// fails without explicit --allow-env permissions
Deno.env.set("myKey", "my_key");
const retrievedKey = Deno.env.get("myKey");
console.log(retrievedKey === "my_key");

// log env vars
const logEnv = (): void => console.log(Deno.env.toObject());
logEnv();
