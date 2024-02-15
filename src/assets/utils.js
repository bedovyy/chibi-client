export function uuidv4() {  
  // @ts-ignore  
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>  
      // tslint:disable-next-line:no-bitwise  
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)  
  );
}

export function getBase64FileExtension(base64String) {
  const charPerExt = { '/': 'jpeg', 'i': 'png', 'R': 'gif', 'U': 'webp', 'J': 'pdf'}
  return charPerExt[base64String[0]] || 'unknown';
}

// CHERRY-PICKED from a1111-sd-webui-tagcomplete
// Parse the CSV file into a 2D array. Doesn't use regex, so it is very lightweight.
// We are ignoring newlines in quote fields since we expect one-line entries and parsing would break for unclosed quotes otherwise
export function parseCSV(str) {
  const arr = [];
  let quote = false;  // 'true' means we're inside a quoted field

  // Iterate over each character, keep track of current row and column (of the returned array)
  for (let row = 0, col = 0, c = 0; c < str.length; c++) {
      let cc = str[c], nc = str[c+1];        // Current character, next character
      arr[row] = arr[row] || [];             // Create a new row if necessary
      arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

      // If the current character is a quotation mark, and we're inside a
      // quoted field, and the next character is also a quotation mark,
      // add a quotation mark to the current column and skip the next character
      if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

      // If it's just one quotation mark, begin/end quoted field
      if (cc == '"') { quote = !quote; continue; }

      // If it's a comma and we're not in a quoted field, move on to the next column
      if (cc == ',' && !quote) { ++col; continue; }

      // If it's a newline (CRLF), skip the next character and move on to the next row and move to column 0 of that new row
      if (cc == '\r' && nc == '\n') { ++row; col = 0; ++c; quote = false; continue; }

      // If it's a newline (LF or CR) move on to the next row and move to column 0 of that new row
      if (cc == '\n') { ++row; col = 0; quote = false; continue; }
      if (cc == '\r') { ++row; col = 0; quote = false; continue; }

      // Otherwise, append the current character to the current column
      arr[row][col] += cc;
  }
  return arr;
}