import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

const ListGroupCard = ({ data, members, paidStatus }) => {
  const activeGroup = useSelector((state) => state.userData.user.activeGroup);
  const userName = useSelector((state) => state.userData.user.name);
  const [value, setValue] = useState('');
  const [textarea, setTextarea] = useState([]);
  const [listActive, setListActive] = useState(false);

  const dispatch = useDispatch();

  const deleteComment = () => {
    setTextarea([]);
  };

  const addClassName = () => {
    setListActive(!listActive);
  };

  const handleChange = (event) => {
    if (activeGroup) {
      const value = event.target.value;
      if (value !== '' && value !== null && value.trim() !== '') {
        setValue(event.target.value);
      }
    }
  };

  const handleSubmit = (event, commentId) => {
    event.preventDefault();
    if (textarea !== null) {
      const updatedTextarea = textarea.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, text: value };
        }
        return comment;
      });
      setTextarea(updatedTextarea);
      setValue('');
    }
  };

  const paidMembers = paidStatus.reduce((acc, member) => {
    const person = Object.entries(member);
    acc.push(String(person[0][0]));
    return acc;
  }, []);

  const share = (data.cost / (members.length + 1)).toFixed(2);


  return (
    <div className='list-box'>
      <div className='list-data-container' onClick={addClassName}>
        <div className='row message-date'>
          <div className='col-2 mt-2'>
            <p>FEB</p>
            <p>02</p>
          </div>
          <div className='col msg-container'>
            <img src='https://s3.amazonaws.com/splitwise/uploads/category/icon/square_v2/uncategorized/general@2x.png' />
            <span> {data.message}</span>
          </div>
        </div>

        <div className='spent-status'>
          <div>
            <p>You Paid</p>
            <strong>${data.cost}</strong>
          </div>
          <div className='lent'>
            <p>You lent</p>
            <strong>${(data.cost - (data.cost / (members.length + 1)).toFixed(2))}</strong>
          </div>
        </div>
      </div>
      <div className={!listActive ? 'Show-list-info' : ''}>
        <div className='row Show-list-header statusOf-prices pt-3'>
          <div className='col-3'>
            <img src='https://s3.amazonaws.com/splitwise/uploads/category/icon/square_v2/uncategorized/general@2x.png' />
          </div>
          <div className='col'>
            <h5>{data.message}</h5>
            <h4>
              <strong> ${data.cost}</strong>
            </h4>
            <p>Added by Vamsi Krishna B. on February 1, 2023</p>
            <p>Last updated by Vamsi Krishna B. on February 1, 2023</p>
            <div className='signup-btn top-btns list-btn'>
              <button className='button'>Edit expense</button>
            </div>
          </div>
        </div>
        <div className='row owe-list'>
          <div className='status-left col'>
            <img src='https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-ruby38-50px.png' />

            <strong>{userName}</strong> paid <strong>${data.cost}</strong> and{' '}
            <span className='status-right px-1'>owes</span>{' '}
            <strong>${share}</strong>

            {members.map((member, index) => {
              const avatarLink = `https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-grey${index + 1}-100px.png`;
              return (
                <div className='mt-4' key={member}>
                  <span>
                    <img src={avatarLink} />
                  </span>
                  <span>
                    <strong> {member}</strong>{' '}
                    <span className='status-right px-1'>owes</span>
                    {paidMembers !== false ? (
                      !paidMembers.find((person) => person === member) ? (
                        <strong>${share}</strong>
                      ) : (
                        <strong>$0.00</strong>
                      )
                    ) : (
                      <strong>${share}</strong>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <div className='status-right col'>
            <strong>Spending by category</strong>
            <p className='txt-secondary'>
              {activeGroup}::{data.message}
            </p>
            <div className='row container mt-2'>
              <div className='row p-2'>
                <h6 className='col-4'>December</h6>
                <div className='col-4 month-status'> </div>
                <h6 className='col-4'>$0.00</h6>
              </div>
              <div className='row p-2'>
                <h6 className='col-4'>January</h6>
                <div className='col-4 month-status'> </div>
                <h6 className='col-4'>$0.00</h6>
              </div>
              <div className='row p-2'>
                <h6 className='col-4'>February</h6>
                <div className='February month-status col-4'> </div>
                <h6 className='col-4'>${data.cost.toFixed(2)}</h6>
              </div>
            </div>
            <p className='text-primary'>View more charts</p>
            <p>
              <i className='fa fa-comment my-2' /> NOTES AND COMMENTS
            </p>

            <form onClick={handleSubmit}>
              <div className='form-group'>
                <textarea
                  placeholder='Add a comment'
                  cols='40'
                  rows='2'
                  onChange={handleChange}
                  value={value}
                ></textarea>
              </div>
              <div className='signup-btn top-btns list-btn post-btn'>
                <button className='submit'>post</button>
              </div>
            </form>

            {textarea.length > 1 && (
              <ul className='posts mt-4'>
                <li className='comment-box'>
                  <div>{textarea}</div>
                  <div className='close' onClick={deleteComment}>
                    x
                  </div>
                </li>
              </ul>
            )}
          </div>
        </div>
        <ul className='paid-list'>
          {paidMembers && (
            <>
              <h5>Transactions</h5>
              {paidMembers.map((member) => {
                return (
                  <li className='paid-person-container' key={member}>
                    <i className='fa-regular fa-circle-check mx-1'></i>
                    <span>
                      <strong> {member}</strong>
                    </span>
                    <span className=''> paid his share of </span>
                    <strong>${share}</strong>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ListGroupCard;