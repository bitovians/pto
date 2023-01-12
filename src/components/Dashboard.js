import { useContext, useEffect } from 'react'
import Context from '../context/context'
import Box from './Box'
import GridContainer from './GridContainer'
import Loading from './Loading'

const Dashboard = (props) => {
  const {
    token,
    loading,
    totalAccruedHours,
    totalAccruedDays,
    totalAvailableHours,
    totalAvailableDays,
    authenticate,
    getPTO,
  } = useContext(Context)

  useEffect(() => {
    (async () => {
      await authenticate()
      await getPTO()
    })()

    // eslint-disable-next-line
  }, [token])

  return (
    <div className='dashboard'>
      {loading ? (
        <Loading />
      ) : (
        <GridContainer>
          <Box value={totalAccruedHours} text='Accrued hours' />
          <Box value={totalAccruedDays} text='Accrued days' />
          <Box
            value={totalAvailableHours}
            text='Total hours available in the year'
          />
          <Box
            value={totalAvailableDays}
            text='Total days available in the year'
          />
        </GridContainer>
      )}
    </div>
  )
}

export default Dashboard
