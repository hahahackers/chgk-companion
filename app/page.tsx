//@ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';

const SECONDS = 60;

export default function Home() {
  const [state, setState] = useState('idle');
  const [value, setValue] = useState('');

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);

  async function handleClick() {
    const response = await fetch(
      `http://www.db.chgk.info/tours/${value}/questions?page=1&itemsPerPage=100`
    );

    const json = await response.json();

    setQuestions(json['hydra:member']);

    setState('loaded');
  }

  return (
    <main className="">
      {state === 'idle' && (
        <div className="flex-col inline-flex gap-2">
          <label className="flex flex-col gap-2" htmlFor="">
            Input package id
            <input
              className="border-2 border-blue-400 p-2 rounded"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <button className="bg-slate-200 p-2 rounded" onClick={handleClick}>
            Submit
          </button>
        </div>
      )}
      {state === 'loaded' && (
        <div className="inline-flex flex-col gap-2">
          <ul className="flex gap-1">
            {questions.map((q, i) => (
              <li
                key={i}
                className={`flex-1 flex  justify-center rounded ${
                  q.answered == null
                    ? 'bg-slate-200'
                    : q.answered
                    ? 'bg-green-200'
                    : 'bg-red-200'
                }`}
              >
                <button onClick={() => setCurrent(i)}>{i + 1}</button>
              </li>
            ))}
          </ul>

          <div className="mt-2">
            {current + 1} of {questions.length}
          </div>

          <Question
            question={questions[current]}
            onAnswer={(answer: boolean) => {
              setQuestions((questions) => {
                questions[current].answered = answer;

                return [...questions];
              });

              setCurrent((p) => Math.min(questions.length - 1, p + 1));
            }}
          >
            <div className="flex gap-2 ">
              <button
                className="rounded bg-orange-200 p-2 disabled:bg-slate-200"
                disabled={current === 0}
                onClick={() => setCurrent((p) => Math.max(0, p - 1))}
              >
                Previous question
              </button>
              <button
                className="rounded bg-orange-200 p-2 disabled:bg-slate-200"
                disabled={current === questions.length - 1}
                onClick={() =>
                  setCurrent((p) => Math.min(questions.length - 1, p + 1))
                }
              >
                Next question
              </button>
            </div>
          </Question>
        </div>
      )}
    </main>
  );
}

enum QuestionState {
  Preparing,
  TimerSet,
  TimerExpired,
  AnswerShown,
}

function Question({ question, onAnswer, children }) {
  const [state, setState] = useState(QuestionState.Preparing);
  const [elapsed, setElapsed] = useState(SECONDS);
  const timer = useRef<number>();

  useEffect(() => {
    setState(QuestionState.Preparing);
    setElapsed(SECONDS);

    return () => {
      timer.current && clearInterval(timer.current);
    };
  }, [question]);

  useEffect(() => {
    if (state === QuestionState.TimerSet && elapsed === 0) {
      setState(QuestionState.TimerExpired);
    }
  }, [state, elapsed]);

  function handleRunTimerClick() {
    setState(QuestionState.TimerSet);

    timer.current = setInterval(() => {
      setElapsed((p) => p - 1);
    }, 1000);
  }

  return (
    <div>
      <h1 className="text-2xl mb-6">{question.question}</h1>
      <div className="flex justify-between">
        <div className="inline-flex flex-col gap-2">
          {state === QuestionState.Preparing && (
            <button
              className="rounded bg-blue-200 p-2"
              onClick={handleRunTimerClick}
            >
              Run timer
            </button>
          )}

          {state === QuestionState.TimerSet && <span>{elapsed} seconds</span>}

          {(state === QuestionState.TimerSet ||
            state === QuestionState.TimerExpired) && (
            <button
              className="rounded bg-blue-200 p-2 disabled:bg-slate-200"
              onClick={() => {
                setState(QuestionState.AnswerShown);
              }}
            >
              <span>Show answer</span>
            </button>
          )}

          {state === QuestionState.AnswerShown && (
            <div className="flex flex-col gap-2">
              <div>{question.answer}</div>
              <div className="flex gap-1">
                <button
                  className="w-20 rounded p-2 bg-green-200"
                  onClick={() => onAnswer(true)}
                >
                  Yes
                </button>
                <button
                  className="w-20 rounded p-2 bg-red-200"
                  onClick={() => onAnswer(false)}
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
