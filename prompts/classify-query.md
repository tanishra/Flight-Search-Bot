{{ $json.message.text }} 

Try to understand the user's input. The user is trying to search for a flight and may have mentioned an origin and destination location in their own way.

Your task is:
1. Parse the user input.
2. Return a **simple string** with:
   - Origin airport code (IATA)
   - Destination airport code (IATA)
   - Travel date in `YYYY-MM-DD` format
   - Number of passengers (if mentioned)

👉 Example output format:
`DEL-JFK-2025-12-25-2` (for 2 passengers from Delhi to New York on Dec 25, 2025)

If any of this information is **missing or unclear**, then instead of the string, return a **beautiful, helpful message** asking the user politely to provide the missing details.

Be smart and flexible — users might say "next Friday", or "me and my wife", or "going to Dubai from Mumbai", etc. Try your best to interpret natural language clearly.

