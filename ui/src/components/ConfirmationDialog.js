import React from 'react';
import PT from 'prop-types';
import { noop } from 'ramda-adjunct';
import { arrayify } from '../utils/generalUtils';
import Modal from 'react-responsive-modal';

//******************************************************************************
// Interface
//******************************************************************************

const confButtonShape = {
  label: PT.string.isRequired,
  onClick: PT.func.isRequired,
  className: PT.string,
};

ConfirmationDialog.propTypes = {
  open: PT.bool,
  title: PT.string,
  subTitle: PT.string,
  text: PT.oneOfType([PT.string, PT.arrayOf(PT.string)]),
    // single message, or array of messages to be dispayed on seperate lines
  confButtons: PT.arrayOf(PT.shape(confButtonShape)).isRequired,
};

ConfirmationDialog.defaultProps = {
  title: '',
  subTitle: '',
  open: false,
};

//******************************************************************************
// ConfirmationDialog
//******************************************************************************

export default function ConfirmationDialog(props) {
  const { open, title, subTitle, text, confButtons } = props;
  return (
    <Modal center open={open} onClose={noop} showCloseIcon={false}>
      <div className='w-350'>
        <div className='fs-lg lh-compress'>{title}</div>
        <div className='fs-xs lh-compress txt-color-lite'>{subTitle}</div>
        { text && <div className='brd-horiz mrg-v-15 pad-t-15 pad-b-10'>
          {arrayify(text).map((t,i)=>
            <div className='text-danger fs-s lh-compress mrg-b-5' key={i}>
             {t}
            </div>)}
         </div>
        }
        <div className='flex-row jc-fe'> {confButtons.map((btn,i)=>
          <button className={`btn btn-sm ${i>0?'mrg-l-10':''} ${btn.className}`}
            onClick={btn.onClick} key={i}>
              {btn.label}
          </button> )}
        </div>
      </div>
    </Modal>

  );
}
