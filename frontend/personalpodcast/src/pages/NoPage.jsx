import React from 'react'

function NoPage() {
  return (
    <div className='container py-5 text-main'>
        <h1 className='text-center mt-5'><i className="text-size-lg bi bi-question-diamond-fill"></i></h1>
        <h1 className='text-center'>404 - Page Not Found</h1>
        <p className='text-center'>It looks like the page you are looking for does not exist.</p>
        <div className='d-flex justify-content-center mt-4'>
            <a href="/" className='btn button-main'>Go to Home</a>
        </div>
    </div>
  )
}

export default NoPage   