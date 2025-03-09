export const mapResultToArray = (resultSet) => {
    let list = [];
    resultSet.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        list.push(result.rows.item(i));
      }
    });
    return list;
  };
  