import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import Country from '../types/Country'
import { CountryCard, SearchInput, RegionDropdown } from '../components'

const fetchCountries = async (): Promise<Country[]> => {
  const params = new URLSearchParams({
    fields: ['cca3', 'flags', 'name', 'population', 'region', 'capital'].join(','),
  }).toString()

  const response = await axios.get<Country[]>(`https://restcountries.com/v3.1/all?${params}`)

  return response.data
}

const PAGE_SIZE = 20

const Home = () => {
  const {
    data: countries = [],
    error,
    isLoading,
  } = useQuery<Country[], Error>({
    queryKey: ['countries'],
    queryFn: fetchCountries,
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [region, setRegion] = useState('')

  const [page, setPage] = useState(1)

  const filteredCountries = countries.filter(country => {
    const matchesSearch =
      searchTerm === '' || country.name.common.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = region === '' || country.region === region

    return matchesSearch && matchesRegion
  })

  const countriesToShow = filteredCountries.slice(0, page * PAGE_SIZE)

  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => setPage(1), [searchTerm, region])

  useEffect(() => {
    if (!loadMoreRef.current) return

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]

        if (!entry.isIntersecting || countriesToShow.length >= filteredCountries.length) return

        setPage(previousPage => previousPage + 1)
      },
      { root: null, rootMargin: '0px 0px 300px 0px', threshold: 0 }
    )

    observer.observe(loadMoreRef.current)

    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current)
    }
  }, [countriesToShow, filteredCountries])

  const renderContent = () => {
    if (error) return <p className="text-sm text-red-400">{error.message}</p>

    if (isLoading) return <p className="text-sm">Loading...</p>

    if (filteredCountries.length === 0) return <p className="text-sm">No countries found.</p>

    return (
      <>
        <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-x-12 gap-y-16">
          {countriesToShow.map(country => (
            <CountryCard key={country.cca3} country={country} />
          ))}
        </div>

        <div ref={loadMoreRef} className="h-10" />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-y-4 md:flex-row md:gap-y-0 items-center justify-between mb-10">
        <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <RegionDropdown region={region} setRegion={setRegion} />
      </div>

      {renderContent()}
    </>
  )
}

export default Home
