for (const item of $input.all()) {
  item.json.myNewField = 1;
}

return JSON.parse($input.first().json.data)