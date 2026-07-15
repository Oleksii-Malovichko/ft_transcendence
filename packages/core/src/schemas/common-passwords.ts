const COMMON = new Set([
  "passwordpassword",
  "passw0rdpassw0rd",
  "123456789012345",
  "1234567890123456",
  "12345678910111213",
  "qwertyuiopasdfgh",
  "qwertyuiopasdfghjkl",
  "abcdefghijklmnop",
  "iloveyouiloveyou",
  "letmeinletmein12",
  "letmeinletmeinnow",
  "administrator123",
  "administratoradmin",
  "welcometothejungle",
  "trustno1trustno1",
  "monkeymonkeymonkey",
  "dragondragondragon",
  "footballfootball",
  "superman123456789",
  "thisismypassword",
  "mypasswordis12345",
  "correcthorsebatterystaple",
  "thequickbrownfoxjumpsoverthelazydog",
  "loremipsumdolorsitamet",
]);

export function normalizeForComparison(password: string): string {
  return password.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isCommonPassword(password: string): boolean {
  const normalized = normalizeForComparison(password);
  return COMMON.has(normalized) || /^(.)\1*$/.test(normalized);
}