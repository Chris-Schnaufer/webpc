import React, { Component } from 'react';
import './Messages.css'

const ERROR = 0;          // An error message
const WARNING = 1;        // A warning message
const WARN = WARNING;     // Shorter warning enumeration
const INFORMATION = 2;    // An informational message
const INFO = INFORMATION; // Shorter information enumeration

const MAX_DISP_MESSAGES = 3; // Maximum number of displayed messages

const MIN_TIMEOUT = 5000;   // Minimum number of ms for message timeout


class Messages extends Component {
  constructor(props) {
    super(props);
    this.close_message = this.close_message.bind(this);
    this.state = { 
      redraw: 0
    };
  }

  static message_number = 100; // Our message tracking number
  static messages = [];      // The current list of messages

  static get ERROR() {return ERROR;}
  static get WARNING() {return WARNING;}
  static get WARN() {return WARN;}
  static get INFORMATION() {return INFORMATION;}
  static get INFO() {return INFO;}
  static get MAX_DISP_MESSAGES() {return MAX_DISP_MESSAGES;}
  static get MIN_TIMEOUT() {return MIN_TIMEOUT;}

  static have_messages() {
    return this.messages.length > 0;
  }

  static add(type, msg, details) {
    const our_id = this.message_number++;
    const new_msg = {'id': our_id,
                     'type': type,
                     'message': msg,
                     'details': details,
                     'timeout': this.MIN_TIMEOUT,
                     'ts': null,
                     'opened': false,
                     'closed': false
                    };
    var updated_msgs = this.messages;

    updated_msgs.push(new_msg);
    this.messages = updated_msgs;
  }

  static set_messages(msgs) {
    this.messages = msgs;
  }

  cleanup_messages(msgs) {
    let new_timeouts = [];
    let del_msgs = [];
    let new_msgs = msgs;

    // Assign timestamps and remove old messages
    new_msgs.forEach((m) => {
      if (m.ts == null) {
        m.ts = Date.now();
        new_timeouts.push(m.id);
      } else if (m.closed == true) {
        del_msgs.push(m.id);
      }
    });

    if (del_msgs.length > 0) {
      new_msgs = new_msgs.filter((m) => del_msgs.indexOf(m.id) == -1);
    }

    if (new_timeouts.length > 0) {
      window.setTimeout(() => this.setup_timeouts(new_timeouts), 10);
    }

    return new_msgs;
  }

  close_message(msg_id) {
    let msg_closed = false;
    Messages.messages.findIndex((m) => {
        if (m.id == msg_id) {
          m.closed = true;
          msg_closed = true;
          return true;
        } else {
          return false;
        }
      });

    if (msg_closed) {
      this.setState({redraw: this.state.redraw++});
    }
  }

  setup_timeouts(ids) {
    Messages.messages.forEach((m) => {
        if (ids.indexOf(m.id) >= 0) {
          window.setTimeout(() => this.close_message(m.id), m.timeout);
        }
      }
    );
  }

  render_messages(msgs) {
    return (
      msgs.map((msg) => {
            const id_str = "message_" + msg.id.toString();
            let msg_wrap_classes = "msg_wrap_base " + 
                      (msg.type == Messages.ERROR ? "message_wrap_err" : msg.type == Messages.WARN ? "message_wrap_warn" : "message_wrap_info");
            return (
              <div key={id_str} id={"message_wrap_" + id_str} class={msg_wrap_classes} >
                <div id={"message_" + id_str + "_close"} class="message_close" onClick={() => this.close_message(msg.id)}></div>
                <div id={"message_" + id_str} class="message_text">{msg.message}</div>
              </div>
            );
          }
        )
      );
  }

  render()
  {
    let updated_messages = this.cleanup_messages(Messages.messages);
    const disp_messages = (updated_messages.length <= Messages.MAX_DISP_MESSAGES
                                        ? updated_messages
                                        : updated_messages.slice(updated_messages.length - Messages.MAX_DISP_MESSAGES - 1));
    Messages.set_messages(updated_messages);

    return (
      <div id="messages_wrap" class="messages_wrap">
        {this.render_messages(disp_messages)}
      </div>
    );
  }
}

export default Messages
