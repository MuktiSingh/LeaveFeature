const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const axios = require('axios');
app.use(express.json())
const mysql = require('mysql');

// Configuration object for the database connection
const config = {
  host: '40.80.90.204',
  user: 'root',
  password: 'auriga@123',
  database: 'dribble',
};
function getPlayerTermById(id){
  console.log(id);
  return new Promise((resolve, reject) => {
    connection.query(`SELECT plan_term FROM court_subscription WHERE user_id = ? AND is_active = 1`, [id], (error, results, fields) => {
      if (error) {
        console.error('Error executing query:', error);
        reject('An error occurred');
        return;
      }
      if (results.length === 0) {
        console.log(1);
        resolve('player not found');
        return;
      }
      console.log(2);
      console.log(results[0])
      const plan = results[0].plan_term;
      resolve(plan);
    });
  });
}
function newPlayerToBeInserted(id, days, formattedDate, dummyStartDate, dummyEndDate){
  console.log(5)
  return new Promise((resolve, reject) => {
    connection.query(`INSERT INTO pause_membership(user_id, leave_credit, leave_days, status, applied_on, start_date, end_date) VALUES (?,?,?,?,?,?,?)`, [id, 1, days, 1, formattedDate, dummyStartDate, dummyEndDate], (error, results, fields) => {
      if (error) {
        console.error('Error executing queryfor INSERT:', error);
        reject('An error occurred');
        return;
      }
      resolve("New Player Inserted. ")
    })
  })
}
function updatePauseRecord(id, dummyStartDate, dummyEndDate,formattedDate, reasonForLeave, days){
  return new Promise((resolve, reject) => {
    connection.query(`INSERT INTO pause_membership_record (user_id, date_to, date_from, applied_on, reasonForLeave, pause_days
      ) VALUES (?, ?, ?, ?, ?, ?)`, [id, dummyStartDate, dummyEndDate, formattedDate, reasonForLeave, days], (error, results, fields) => {
      if (error) {
        console.error(`An Error occured while recording leave dates`, error);
        reject(`error while recording leave days`);
        return;
      }
      resolve("DONE!");
    })
  })
}
// Step 1: Fetch the original date from the database
function updateCourtSubscription(id, days) {
  const selectQuery = "SELECT expiry_date FROM court_subscription WHERE user_id = ? AND is_active = 1;";
  connection.query(selectQuery, [id], (selectErr, selectResults) => {
      if (selectErr) {
          console.error('Error fetching data from the database:', selectErr);
          connection.end();
          return;
      }
      const originalDate = selectResults[0].expiry_date;
      console.log('Original Date from the Database:', originalDate);
      // Step 2: Modify the date (add 3 days, for example)
      const daysToAdd = days;
      const modifiedDate = new Date(originalDate);
      modifiedDate.setDate(modifiedDate.getDate() + daysToAdd);
      console.log('Modified Date:', modifiedDate);
       // Step 3: Update the database with the modified date
      const updateQuery = "UPDATE court_subscription SET expiry_date = ? WHERE user_id = ? AND is_active = 1;";

      connection.query(updateQuery, [modifiedDate, id], (updateErr, updateResults) => {
          if (updateErr) {
              console.error('Error updating data in the database:', updateErr);
          } else {
              console.log('Date updated in the database.');
          }
      });
  });
}

function existingPlayerToBeUpdatedCreditCheck(id) {
  console.log(6);
  return new Promise((resolve, reject) => {
    connection.query(`SELECT leave_credit FROM pause_membership WHERE user_id = ?`, [id], (error, results, fields) => {
      if (error) {
        console.error('Error executing queryfor UPDATE:', error);
        reject('An error occurred');
        return;
      }
      if (results.length === 0) {
        resolve(0)
        return;
      }
      const credit = results[0].leave_credit;

      resolve(credit);
    })
  })
}
function existingPlayerToBeUpdated(id, days, startDate, endDate){
  console.log(7);
  return new Promise((resolve, reject) => {
    connection.query(`UPDATE pause_membership SET leave_days = leave_days + ?, leave_credit = leave_credit+1, start_date = ?, end_date = ?  WHERE user_id = ?`, [days, startDate, endDate, id], (error, results, fields) => {
      if (error) {
        console.error('Error executing queryfor UPDATE:', error);
        reject('An error occurred');
        return;
      }
      resolve("updated")
    })
  })
}
function findStartDate(id){
  return new Promise((resolve, reject) => {
    connection.query(`SELECT start_date, end_date FROM pause_membership WHERE user_id = ?`, [id], (error, results, fields)=> {
      if(error){
        console.error(error);
        reject ('An error occurred in finding start date and end date');
        return;
      }
      if(results.length===0){
        resolve('NoResult');
      }
      resolve(results);
    })
  })
}
module.exports.someVariable = 42;
async function leave_request_plan2(req) {
  console.log(req.body);
  let id = req.body.id;
  let plan = ""
  let reasonForLeave = req.body.additionalDate;
  console.log(reasonForLeave);


  

  

  const startDate = new Date(req.body.start_date);
  const endDate = new Date(req.body.end_date);

  const dummyStartDate = new Date(startDate);
  const dummyEndDate = new Date(endDate);

  const formattedStartDate = startDate.toISOString().split('T')[0];
  const formattedEndDate = endDate.toISOString().split('T')[0];
  let flag1 = false;
  await findStartDate(id).then((sample)=> {
    console.log("33333 : ", sample)
    if(sample!='NoResult'){
      let a_startDate = sample[0].start_date;
      let b_startDate = sample[0].end_date
      if((a_startDate<=startDate && b_startDate>=endDate) || (a_startDate>=startDate && a_startDate<=endDate) || (b_startDate>=startDate && b_startDate<=endDate)){
        console.log("I am here")
        flag1 = true;
      }
    }
  }).catch((error) => {
    console.log(error)
  })
  if(flag1===true){
    return;
  }
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const dayCounts = {};
  let daysInNumber = 0;
  let currentDate = startDate;
  while (currentDate <= endDate) {
    const dayIndex = currentDate.getDay();
    const dayName = daysOfWeek[dayIndex];
    if (!dayCounts[dayName]) {
      dayCounts[dayName] = 1;
    } else {
      dayCounts[dayName]++;
    }
    daysInNumber++;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  let _days = daysInNumber;



  let _plan = "Hello"
  let flag3 = 1;
  await getPlayerTermById(id)
    .then((plan) => {
      if (plan === 'player not found' || plan===undefined) {
        flag3 = 2
        console.log(13,"player not found");
        return 'ERROR : Player not found in court subscription';
      }
      console.log(12,plan);
      _plan = plan;

    })
    .catch((error) => {
      return error;
      //console.error('Error:', error);
    });
    console.log(8,_plan)
    if(flag3===2){
      return 'ERROR : Player not found in court subscription';
    }
  let credit = 0;
  switch (_plan) {
    case 'MONTHLY':
      credit = 1
      break;
    case 'QUARTERLY':
      credit = 1
      break;
    case 'SEMI_ANNUAL':
      credit = 2
      break;
    case 'ANNUAL':
      credit = 4
      break;
    case 'YEARLY' : 
      credit = 4
      break;
    default:
      credit = -1
      break;
  }


  const currDate = new Date();
  const indianTimeOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  };
  const formattedDate = currDate.toLocaleString('en-IN', indianTimeOptions).toUpperCase();

  const checkPlayerPresentInLeaveTable = (id) => {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM pause_membership WHERE user_id = ?`, [id], (error, results, fields) => {
        if (error) {
          console.error('Error executing query:', error);
          reject('An error occurred');
          return;
        }
        console.log(9);
        if (results.length === 0) {
          // Player not found
          
        console.log(10,results);
          newPlayerToBeInserted(id, _days, formattedDate,dummyStartDate, dummyEndDate).then((sample) => {
          updatePauseRecord(id, dummyStartDate, dummyEndDate,formattedDate, reasonForLeave, _days);
          updateCourtSubscription(id, _days);
        console.log(11,sample);
          })
            .catch((error) => {

            });
          resolve("");
          return;
        } else {
          existingPlayerToBeUpdatedCreditCheck(id).then((__credit) => {
            console.log(444, __credit, " ", credit);
            if (__credit < credit) {
              updatePauseRecord(id, dummyStartDate, dummyEndDate,formattedDate, reasonForLeave, _days).then((sample) => {
                updateCourtSubscription(id, _days);
              })
                .catch((error) => {
                  console.error('Error:', error);
                });
              existingPlayerToBeUpdated(id, _days, dummyStartDate, dummyEndDate).then((sample) => {
              })
                .catch((error) => {
                  console.error('Error:', error);
                });
            } else {
            }
          })
            .catch((error) => {
              console.error(error);
            })
        }
        resolve("")


        // Extract the term from the first row
        const plan = results[0].term;
        resolve(plan);
      });
    });
  };

  checkPlayerPresentInLeaveTable(id).then((sample) => {
  })
    .catch((error) => {
    })
  return ("");
}

function findStartDate2(id, id2){
  return new Promise((resolve, reject) => {
    connection.query(`SELECT start_date, end_date FROM leave_table WHERE player_id = ? AND batch_id = ?`, [id, id2], (error, results, fields)=> {
      if(error){
        console.error(error);
        reject ('An error occurred in finding start date and end date');
        return;
      }
      if(results.length===0){
        resolve('NoResult');
      }
      resolve(results);
    })
  })
}




async function leave_request(req) {

  let id = req.body.id;

  let batch_id = req.body.id2;
  let batch_id2 = "";
  batch_id2 += batch_id;
  let plan = ""
  let reasonForLeave = req.body.additionalDate;
  const getPlayerTermById = (id) => {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT term FROM player_batch WHERE player_id = ? AND batch_id = ?`, [id, batch_id], (error, results, fields) => {
        if (error) {
          console.error('Error executing query:', error);
          reject('An error occurred');
          return;
        }
        if (results.length === 0) {
          // Player not found
          resolve('player not found');
          return;
        }
        // Extract the term from the first row
        const plan = results[0].term;
        resolve(plan);
      });
    });
  };

  const startDate = new Date(req.body.start_date);
  const endDate = new Date(req.body.end_date);

  const dummyStartDate = new Date(startDate);
  const dummyEndDate = new Date(endDate);

  const formattedStartDate = startDate.toISOString().split('T')[0];
  const formattedEndDate = endDate.toISOString().split('T')[0];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let _flag1 = false
  await findStartDate2(id, batch_id).then((sample)=> {
    console.log("33333 : ", sample)
    if(sample!='NoResult'){
      let a_startDate = sample[0].start_date;
      let b_startDate = sample[0].end_date
      if((a_startDate<=startDate && b_startDate>=endDate) || (a_startDate>=startDate && a_startDate<=endDate) || (b_startDate>=startDate && b_startDate<=endDate)){
        console.log("I am here")
        _flag1 = true;
      }
    }
  }).catch((error)=>{
    console.log(error);
  })
  if(_flag1){
    return;
  }
  const dayCounts = {};
  let daysInNumber = 0;
  let currentDate = startDate;
  while (currentDate <= endDate) {
    const dayIndex = currentDate.getDay();
    const dayName = daysOfWeek[dayIndex];
    if (!dayCounts[dayName]) {
      dayCounts[dayName] = 1;
    } else {
      dayCounts[dayName]++;
    }
    daysInNumber++;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  let _days = daysInNumber;

  const sortedDayCounts = Object.entries(dayCounts)
    .sort(([dayNameA, countA], [dayNameB, countB]) => {
      const dayIndexA = daysOfWeek.indexOf(dayNameA);
      const dayIndexB = daysOfWeek.indexOf(dayNameB);
      return dayIndexA - dayIndexB;
    });
  const sortedDayCountsObj = Object.fromEntries(sortedDayCounts);

  let daysCount = 0;


  //const weekly_plan = req.body.weekly_plan;
  let weekly_plan;

  weekly_plan = req.body.weekly_plan;


  for (const day in sortedDayCountsObj) {
    if (sortedDayCountsObj.hasOwnProperty(day)) {
      const count = sortedDayCountsObj[day];
      // console.log(`${day}: ${count}`);
      if (weekly_plan == "MtoF") {
        if (day == "Monday") {
          daysCount += count;
        } else if (day == "Tuesday") {
          daysCount += count;
        } else if (day == "Wednesday") {
          daysCount += count;
        } else if (day == "Thursday") {
          daysCount += count;
        } else if (day == "Friday") {
          daysCount += count;
        }

      }
      if (weekly_plan == "MWF") {
        if (day == "Monday") {
          daysCount += count;
        } else if (day == "Wednesday") {
          daysCount += count;
        } else if (day == "Friday") {
          daysCount += count;
        }
      }

      if (weekly_plan == "TTS") {
        if (day == "Tuesday") {
          daysCount += count;
        } else if (day == "Thursday") {
          daysCount += count;
        } else if (day == "Saturday") {
          daysCount += count;
        }
      }
      if (weekly_plan == "SS") {
        if (day == "Saturday") {
          daysCount += count;
        } else if (day == "Sunday") {
          daysCount += count;
        }
      }
    }
  }

  let _plan = "Hello"
  await getPlayerTermById(id)
    .then((plan) => {
      _plan = plan;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  // console.log(_plan)

  let credit = 0;
  switch (_plan) {
    case 'MONTHLY':
      credit = 1
      break;
    case 'QUARTERLY':
      credit = 1
      break;
    case 'SEMI_ANNUAL':
      credit = 2
      break;
    case 'ANNUAL':
      credit = 4
      break;
    default:
      credit = -1
      break;
  }

  const checkMonthlyFees = (id) => {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT monthly_fees FROM player_batch WHERE player_id = ? AND batch_id = ?`, [id, batch_id], (error, results, fields) => {
        if (error) {
          console.error('Error executing queryfor UPDATE:', error);
          reject(-1);
          return;
        }
        if (results.length === 0) {
          resolve(0)
          return;
        }
        const _monthlyAmount = results[0].monthly_fees;
        resolve(_monthlyAmount);
      })
    })
  }
  let initialAmount = -5;

  await checkMonthlyFees(id).then((_monthlyFees) => {
    initialAmount = _monthlyFees
  }).catch((error) => {
    console.log(error)
  })


  let fixedDays = 0;


  if (weekly_plan == 'MtoF') {
    fixedDays = 20;
  } else if (weekly_plan == 'MWF') {
    fixedDays = 12;
  } else if (weekly_plan == 'TTS') {
    fixedDays = 12;
  } else if (weekly_plan == 'SS') {
    fixedDays = 8;
  }


  const daysInMonth = fixedDays;
  const daysInQuarter = fixedDays * 3;
  const daysInHalfYear = fixedDays * 6;
  const daysInYear = fixedDays * 12;


  const currDate = new Date();
  const indianTimeOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  };
  const formattedDate = currDate.toLocaleString('en-IN', indianTimeOptions).toUpperCase();


  let amount = initialAmount;


  switch (_plan) {
    case 'MONTHLY':
      amount = initialAmount * (daysCount / daysInMonth);
      break;
    case 'QUARTERLY':
      amount = initialAmount * (daysCount / daysInQuarter);
      break;
    case 'SEMI_ANNUAL':
      amount = initialAmount * (daysCount / daysInHalfYear);
      break;
    case 'ANNUAL':
      amount = initialAmount * (daysCount / daysInYear);
      break;
    default:
      break;
  }
  const newPlayerToBeInserted = (id, days) => {
    return new Promise((resolve, reject) => {
      connection.query(`INSERT INTO leave_table (player_id, leave_credit, leave_days, amount, status, start_date, end_date, applied_on, missed_session, batch_id) VALUES (?, ?, ?, ?,?,?,?,?,?, ?)`, [id, 1, days, amount, 1, dummyStartDate, dummyEndDate, formattedDate, daysCount, batch_id], (error, results, fields) => {
        if (error) {
          console.error('Error executing queryfor INSERT:', error);
          reject('An error occurred');
          return;
        }
        resolve("SOLVED")
      })
    })
  }
  const updateLeaveTable2 = (id, date_to, date_from) => {
    return new Promise((resolve, reject) => {
      connection.query(`INSERT INTO leave_record (player_id, batch_id, date_to, date_from, applied_on, reasonForLeave, missed_session) VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, batch_id2, date_to, date_from, formattedDate, reasonForLeave, daysCount], (error, results, fields) => {
        if (error) {
          console.error(`An Error occured while recording leave dates`, error);
          reject(`error while recording leave days`);
          return;
        }
        resolve("DONE!");
      })
    })
  }
  const existingPlayerToBeUpdated = (id, days, startDate, endDate) => {
    return new Promise((resolve, reject) => {
      connection.query(`UPDATE leave_table SET leave_days = leave_days + ?, leave_credit = leave_credit+1, amount = amount + ?, start_date = ?, end_date = ?  WHERE player_id = ? AND batch_id = ?`, [days, amount, startDate, endDate, id, batch_id], (error, results, fields) => {
        if (error) {
          console.error('Error executing queryfor UPDATE:', error);
          reject('An error occurred');
          return;
        }
        resolve("updated")
      })
    })
  }

  const existingPlayerToBeUpdatedCreditCheck = (id) => {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT leave_credit FROM leave_table WHERE player_id = ? AND batch_id = ?`, [id, batch_id], (error, results, fields) => {
        if (error) {
          console.error('Error executing queryfor UPDATE:', error);
          reject('An error occurred');
          return;
        }
        if (results.length === 0) {
          resolve(0)
          return;
        }
        const credit = results[0].leave_credit;
        resolve(credit);
      })
    })
  }

  const checkPlayerPresentInLeaveTable = (id) => {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM leave_table WHERE player_id = ? AND batch_id = ?`, [id, batch_id], (error, results, fields) => {
        if (error) {
          console.error('Error executing query:', error);
          reject('An error occurred');
          return;
        }
        if (results.length === 0) {
          // Player not found
          newPlayerToBeInserted(id, _days).then((sample) => {
            updateLeaveTable2(id, formattedStartDate, formattedEndDate).then((sample) => {
            }).catch((error) => {
              console.error('ERROR : ', error);
            })
          })
            .catch((error) => {
              console.error('Error:', error);
            });
          resolve('player inserted');
          return;
        }

        let _credit;
        existingPlayerToBeUpdatedCreditCheck(id).then((__credit) => {
          if (__credit < credit) {
            existingPlayerToBeUpdated(id, _days, dummyStartDate, dummyEndDate).then((sample) => {
              updateLeaveTable2(id, formattedStartDate, formattedEndDate).then((sample) => {
                console.log("updated leave record");
              }).catch((error) => {
                console.log(error)
              })
            })
              .catch((error) => {
                console.error('Error:', error);
              });
          }
        })
          .catch((error) => {
            console.error(error);
          })

        resolve("FOUND")

        // Extract the term from the first row
        const plan = results[0].term;
        resolve(plan);
      });
    });
  };

  checkPlayerPresentInLeaveTable(id).then((sample) => {
    //console.log(sample)
  })
    .catch((error) => {
      console.log(error)
    })
}







app.post('/leave-request-checker', async (req, res) => {
  let response__ = ""
  const findId = (id) => {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT id FROM player WHERE user_id = ?`, [id], (error, results, fields) => {
        if (error) {
          console.log("ERROR recorded here");
          reject(error);
          return;
        }
        if (results.length === 0) {
          //res.status(200).send({"message" : "paaji na ho paya"});
          resolve("nil")
        }
        resolve(results);
        return;
      })
    })
  }

  let id = req.body.id;
  let startDate = new Date(req.body.start_date);
  let endDate = new Date(req.body.end_date);
  let reasonForLeave = req.body.additionalDate;
  if (req.body.planType === 'SUBSCRIPTION') {
    //response__ =await axios.post('http://localhost:3000/leave-request-plan2', req.body);
    response__ = await leave_request_plan2(req)
  } else {
    let _id 
    await findId(req.body.id).then((sample) => {
      if (sample[0].id===undefined) {
        res.status(200).send({ "message": "paaji na ho paya" });
        return;
      }
      req.body.id = sample[0].id;
      _id = sample[0].id;
    }).catch((error) => {
      console.log("ERRORHELLO");
    })
    const interval = (id) => {
      return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM player_batch WHERE player_id = ?`, [id], (error, results, fields) => {
          if (error) {
            reject("ERROR while retrieving player_batch");
            return;
          }
          resolve(results);
        })

      })
    }
    let arr1 = [];
    await interval(_id).then((sample) => {
      
      arr1 = sample;

    }).catch((error) => {
      console.log(error);
    })

    const findingMWFVariables = (batchId) => {
      return new Promise((resolve, reject) => {
        connection.query(`SELECT week_type FROM batch WHERE id = ?`, [batchId], (error, results, fields) => {
          if (error) {
            console.log("ERROR is here 2 : ", error);
            reject("ERROR while finding batch id");
            return;
          }
          let a = results[0].week_type;
          resolve(a);
          return;
        })
      })
    }
    
    const leaves = (id, batchId) => {
      return new Promise((resolve, reject) => {
        connection.query(`SELECT start_date FROM leave_table WHERE player_id = ? AND batch_id = ?`, [id, batchId], (error, results, fields) => {
          if (error) {
            console.log("ERROR in finding leaves", error);
            reject("some error");
            return;
          }
          if (results.length === 0) {
            resolve("no leaves applied");
            return;
          }
          let a = results[0].start_date;
          resolve(a);
          return;
        })
      })
    }


    for (let i = 0; i < arr1.length; i++) {
      let nextDueDate = arr1[i].next_payment_due_date;
      let status = arr1[i].status;
      let currDate = new Date();
      let a = req.body;
      //console.log(a);


      a.id2 = arr1[i].batch_id;
      let b;
      b = a.id2;

      let dateChecker;
      await leaves(id, b).then((sample) => {
        dateChecker = sample;
      }).catch((error) => {
        console.log("some error");
      })
      let flag1 = false;
      if (dateChecker == "no leaves applied") {
        flag1 = true;
      } else {
        dateChecker.setMonth(dateChecker.getMonth() + 3);
        if (dateChecker < startDate) {
          flag1 = true;
        }
      }

      //console.log("w123123213 : ",arr1[i].term)
      if (flag1 && arr1[i].term === "MONTHLY") {
        continue;
      }
      //Next Validation : 
      if (status == 1 && currDate <= nextDueDate) {
        let val1;
        let val2;
        await findingMWFVariables(b).then((sample) => {
          val1 = sample
        }).catch((error) => {
          console.log(error);
        })
        if (val1 === 'WEEK_MWF') {
          val2 = 'MWF';
        } else if (val1 === 'WEEK_TTS') {
          val2 = 'TTS';
        } else if (val1 === 'WEEKEND') {
          val2 = 'SS';
        } else {
          val2 = 'MtoF';
        }
        a["weekly_plan"] = val2;
        response__ = await leave_request({ body: a });
        //response__ = await axios.post('http://localhost:3000/leave-request', a);
        //send post request to the other leave-request
      }
    }
  }
  //console.log("3 : ", arr1[0].monthly_fees);

  res.status(200).send({ "message": "done" });

})

const connection = mysql.createConnection(config);
// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});


app.listen(port, () => {
  console.log('Server is running on port', port);
})
